import { STATUS_LABELS, type EventStatus } from './event'
import { toEvaluation, type Evaluation } from './evaluation'
import type { EventSnapshot } from './snapshot'
import { TRANSITIONS, evaluateTransition, runGuards, type HostActionId } from './transitions'

export const HOST_ACTION_LABELS: Record<HostActionId, string> = {
  schedule: 'Schedule event',
  goLive: 'Go live',
  endStream: 'End stream',
  enableReplay: 'Enable replay',
}

/**
 * The host actions offered in each status. In Scheduled the host is shown "Go live"
 * (blocked) so they can see exactly what stands between them and the broadcast.
 */
const ACTIONS_BY_STATUS: Record<EventStatus, readonly HostActionId[]> = {
  draft: ['schedule'],
  scheduled: ['goLive'],
  ready: ['goLive'],
  live: ['endStream'],
  completed: ['enableReplay'],
  replay_available: [],
}

export interface AvailableAction {
  id: HostActionId
  label: string
  target: EventStatus
  evaluation: Evaluation
}

/**
 * Evaluates a host action. When the event is not yet in the action's source status,
 * the action is blocked with that reason plus whatever its guards would still require.
 */
export function evaluateHostAction(
  snapshot: EventSnapshot,
  actionId: HostActionId,
  now: Date = new Date(),
): Evaluation {
  const transition = TRANSITIONS[actionId]
  if (snapshot.event.status === transition.from) {
    return evaluateTransition(snapshot, transition.to, now)
  }
  const actionLabel = HOST_ACTION_LABELS[actionId].toLowerCase()
  return toEvaluation([
    {
      code: 'wrong_status',
      message: `The event must be ${STATUS_LABELS[transition.from]} to ${actionLabel}.`,
    },
    ...runGuards(transition, snapshot, now),
  ])
}

/** Host actions for the current status, each with its allowed/blocked evaluation. */
export function getAvailableActions(
  snapshot: EventSnapshot,
  now: Date = new Date(),
): AvailableAction[] {
  return ACTIONS_BY_STATUS[snapshot.event.status].map((id) => ({
    id,
    label: HOST_ACTION_LABELS[id],
    target: TRANSITIONS[id].to,
    evaluation: evaluateHostAction(snapshot, id, now),
  }))
}

const EDITABLE_REQUIREMENT_STATUSES: ReadonlySet<EventStatus> = new Set([
  'draft',
  'scheduled',
  'ready',
])

/** Operational requirements can only be changed before the event goes live. */
export function evaluateRequirementChange({ event }: EventSnapshot): Evaluation {
  if (EDITABLE_REQUIREMENT_STATUSES.has(event.status)) return toEvaluation([])
  return toEvaluation([
    {
      code: 'requirements_locked',
      message: `Requirements are locked because the event is ${STATUS_LABELS[event.status]}.`,
    },
  ])
}
