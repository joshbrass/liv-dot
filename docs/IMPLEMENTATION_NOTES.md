# Implementation notes

This document explains how the code is organised, how state is managed and why, which
assumptions were made where the brief left room for interpretation, the trade-offs taken, and
what would come next in a production setting.

For the state model itself — types, transitions and blocked states — see
[STATE_MODELING.md](STATE_MODELING.md).

---

## Layering

The code is split into four layers with a one-way dependency direction:

```
components  →  state  →  services  →  domain
     └──────────────────────────────────┘
          (components also read domain types and labels)
```

| Layer         | Responsibility                                                       | Depends on React? |
| ------------- | -------------------------------------------------------------------- | :---------------: |
| `domain/`     | Lifecycle rules, readiness rules, guards, block reasons              |        No         |
| `services/`   | Backend contract and the in-memory mock backend                      |        No         |
| `state/`      | Reducer, selectors, notices, and the provider that performs requests |   Provider only   |
| `components/` | Rendering and user interaction                                       |        Yes        |

The domain layer has no knowledge of React, HTTP or the reducer, which makes its rules easy to
test exhaustively and lets the mock backend reuse them unchanged.

---

## Component structure

Components are grouped by feature rather than by type, so everything about one part of the
screen sits together:

| Folder        | Components                                                         | Role                                                        |
| ------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| (root)        | `EventDashboard`                                                   | The only component that reads the store; passes plain props |
| `layout/`     | `DashboardLayout`                                                  | Top bar (logo, breadcrumb, status pill) and page frame      |
| `event/`      | `EventHeader`, `StatusBadge`, `LifecycleStepper`                   | Who/what/when of the event and where it is in the lifecycle |
| `readiness/`  | `ReadinessChecklist`, `RequirementItem`, `RequirementIcon`         | Requirement rows, their states and configure actions        |
| `actions/`    | `ActionPanel`, `ActionButton`, `BlockReasonList`, `StartTimeField` | The "Go live" card and its blockers                         |
| `activity/`   | `ActivityFeed`, `ActivityEntry`                                    | System feedback as a timeline                               |
| `simulation/` | `DemoDrawer`, `SimulationPanel`, `ScenarioPresets`, `DemoToggle`   | Reviewer-only demo controls                                 |
| `feedback/`   | `LoadingSkeleton`, `ErrorState`, `EmptyState`                      | Loading, failure and empty states                           |
| `ui/`         | shadcn/ui primitives                                               | Button, Badge, Sheet, Skeleton, Tooltip                     |

**Container and presentational split.** `EventDashboard` is the single connected component. It
reads state through `useEventDashboard()`, derives props with selectors, and renders
presentational components that receive data and callbacks. This keeps most components testable
by passing fixtures directly, without a provider or a mock API.

**Small, single-purpose files.** Pieces that were growing inside larger components were split
out: `ActionButton` and `StartTimeField` from the action card; `ScenarioPresets`, `DemoToggle`
and `ControlGroup` from the demo panel; `RequirementIcon` from the requirement row. Non-component
helpers (`blockerCopy.ts`, `requirementAnchor.ts`, `requirementDisplayState.ts`,
`useFirstSeenTimes.ts`) live in their own modules so component files export only components,
which keeps React Fast Refresh reliable.

**Responsive order follows source order.** On wide screens the checklist takes two thirds of
the grid and the "Go live" card and activity feed share the remaining third. On narrow screens
the same source order produces checklist → "Go live" → activity, without CSS reordering, so
keyboard and screen-reader order always match the visual order.

---

## State management approach

State is managed with `useReducer` and React context, wrapped in `EventProvider` and exposed
through the `useEventDashboard()` hook.

### Why `useReducer` + context

- **Explicit transitions.** Every change to state is a named action
  (`REQUIREMENT_UPDATE_STARTED`, `TRANSITION_FAILED`, …). The reducer reads as a list of
  everything that can happen to the dashboard, and the `never` check guarantees each action is
  handled.
- **Pure and testable.** The reducer is a plain function. Its success, failure and stale-response
  paths are covered by unit tests that need no rendering.
- **Fits the problem size.** The dashboard manages one event, three requirements and one
  transition at a time. A state library would add concepts and dependencies without solving a
  problem this scope has.
- **Side effects stay out of the reducer.** `EventProvider` performs API calls and dispatches
  what was requested and what came back. The reducer only records outcomes.

### Server state vs. UI state

| Kind                  | Examples                                           | Where it lives                             |
| --------------------- | -------------------------------------------------- | ------------------------------------------ |
| Server state          | Event, requirement flags                           | Reducer, replaced by each backend response |
| Request state         | Pending/failed requirement or transition           | Reducer, alongside the data it relates to  |
| System feedback       | Notices                                            | Reducer                                    |
| Derived state         | Available actions, blockers, readiness count       | Selectors, recomputed on render            |
| Local UI state        | Start time being typed, open drawer, active preset | Component `useState`                       |
| Display-only metadata | Time a notice first appeared                       | `useFirstSeenTimes` in the activity feed   |

### Backend as the source of truth

The mock backend owns the event record and applies the same domain rules the UI displays. Each
mutation returns the full, reconciled record, and the client stores it as-is. This mirrors a
real system where the server decides state and the client explains it, and it means the client
cannot drift into a state the backend would reject.

---

## Assumptions

Where the brief was open, the following decisions were made:

1. **One event per dashboard.** The dashboard manages a single event, so there is no event list
   or routing.
2. **Scheduling needs a future start time.** A start time equal to or before "now" is rejected.
   Times are entered and displayed in the browser's local time zone and stored as ISO strings.
3. **Scheduling can lead straight to Ready.** If every requirement is already met when a draft
   is scheduled, the backend reconciles immediately and the event becomes Ready for Streaming.
4. **Requirements can be configured while still a draft.** Readiness work can start before a
   date is chosen; promotion only happens once the event is scheduled.
5. **Requirements lock once live.** Requirements cannot be changed while Live, Completed or
   Replay Available. Losing crew or ingest mid-broadcast is modelled as a stream failure instead.
6. **Going live waits for settled configuration.** "Go live" is blocked while any requirement
   change is still saving, so the host never goes live on configuration that might fail.
7. **A stream failure ends the event.** A dropped broadcast moves the event to Completed, with an
   error entry explaining it was unplanned.
8. **Configuring a requirement is a single step.** In a real product, assigning a crew or setting
   prices would open a form; here the action marks the requirement as configured.
9. **Venue is shown as "Online".** The event model has no venue field. All LIV DOT events are
   streamed, so the header shows "Online" as a fixed value until a real field exists.

---

## Trade-offs

| Decision                                                                                                                     | Benefit                                                                         | Cost                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| One `updateRequirement(id, satisfied)` endpoint instead of `assignCrew`, `configureIngest`, `setPricing` and their opposites | One code path for all requirements; adding a requirement does not add endpoints | Less like a real API, where each requirement would have its own payload          |
| Backend-authoritative updates, no optimistic UI                                                                              | The UI never shows a state the backend rejected; failures need no rollback      | The host waits for the round trip (spinners make this visible)                   |
| Derived values recomputed on each render                                                                                     | Cannot go stale; no memoisation bugs                                            | Negligible work at this size; larger data would need memoised selectors          |
| Single context for state and actions                                                                                         | Simple wiring                                                                   | Every consumer re-renders on any change; acceptable with one connected component |
| `aria-disabled` instead of `disabled` for blocked actions                                                                    | Blocked buttons stay focusable and announce their reasons                       | Click handling must ignore activation explicitly                                 |
| UI copy for requirement blockers (`blockerCopy.ts`)                                                                          | Clear, actionable wording; domain messages stay generic and testable            | Two sources of wording to keep in step                                           |
| Activity timestamps recorded in the UI                                                                                       | Reducer and notices stay unchanged and serialisable                             | Times reflect when the notice appeared, not when the backend acted               |
| Notices replace each other by key                                                                                            | No pile-up of stale errors                                                      | Older entries about the same subject are not kept as history                     |
| Generation counter for stale responses                                                                                       | Simple and reliable across scenario resets                                      | Does not cancel the underlying request; results are only ignored                 |
| Non-modal demo drawer                                                                                                        | Reviewers can watch the dashboard react while changing settings                 | The drawer can overlap the right-hand column on narrower screens                 |

---

## What would come next

**Data and APIs**

- **TanStack Query for server state.** Caching, request deduplication, retries with backoff,
  background refetching and request cancellation would replace most of the hand-written request
  tracking in `EventProvider`, leaving the reducer for UI-only state.
- **Typed API client and validation.** Generate types from an OpenAPI schema and validate
  responses at the boundary (for example with Zod).
- **Real requirement forms.** Crew assignment, ingest setup and pricing as proper forms with
  their own validation, rather than single-step toggles.

**Real-time behaviour**

- **Push updates.** WebSockets or Server-Sent Events for status changes made elsewhere (by a
  producer, or the streaming provider), replacing the simulated backend changes.
- **Stream health.** Live bitrate, dropped frames and viewer counts while live, with warnings
  before a stream fails rather than only after.
- **Server-side activity log.** Timestamped events from the backend, persisted and paginated,
  instead of UI-recorded times.

**Product**

- **Optimistic updates with rollback** for low-risk actions, keeping go-live server-confirmed.
- **Roles and permissions.** Host, producer and viewer roles, with role checks expressed as
  additional domain guards so blocked reasons explain missing permissions the same way.
- **Multiple events.** An events list and per-event routes (`/events/:id`).
- **Confirmation for irreversible actions** such as ending a stream.

**Quality**

- **End-to-end tests** (for example with Playwright) for the main walkthroughs, and automated
  accessibility checks in CI.
- **Visual regression tests** for the key states.
- **Internationalisation** of copy, dates and numbers.
- **Error monitoring** for failed requests and unexpected states.
