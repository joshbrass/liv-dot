import { STATUS_LABELS, type EventStatus, type PublishedStatus } from './event'
import { toEvaluation, type BlockReason, type Evaluation } from './evaluation'
import {
  requireAllRequirementsMet,
  requireFutureStartTime,
  requireNoPendingRequirementChanges,
  requireSomeRequirementUnmet,
  type Guard,
} from './guards'
import type { EventSnapshot } from './snapshot'

export type HostActionId = 'schedule' | 'goLive' | 'endStream' | 'enableReplay'
export type SystemTransitionId = 'promote' | 'regress'
export type TransitionId = HostActionId | SystemTransitionId

export interface TransitionDefinition {
  from: EventStatus
  /** No transition ever returns an event to Draft. */
  to: PublishedStatus
  /** `host` transitions are triggered by the host; `system` ones are applied automatically. */
  trigger: 'host' | 'system'
  guards: readonly Guard[]
}

/** Every allowed lifecycle edge. Anything not listed here is an invalid transition. */
export const TRANSITIONS: Record<TransitionId, TransitionDefinition> = {
  schedule: { from: 'draft', to: 'scheduled', trigger: 'host', guards: [requireFutureStartTime] },
  promote: {
    from: 'scheduled',
    to: 'ready',
    trigger: 'system',
    guards: [requireAllRequirementsMet],
  },
  regress: {
    from: 'ready',
    to: 'scheduled',
    trigger: 'system',
    guards: [requireSomeRequirementUnmet],
  },
  goLive: {
    from: 'ready',
    to: 'live',
    trigger: 'host',
    guards: [requireAllRequirementsMet, requireNoPendingRequirementChanges],
  },
  endStream: { from: 'live', to: 'completed', trigger: 'host', guards: [] },
  enableReplay: { from: 'completed', to: 'replay_available', trigger: 'host', guards: [] },
}

export function findTransition(
  from: EventStatus,
  to: EventStatus,
): TransitionDefinition | undefined {
  return Object.values(TRANSITIONS).find(
    (transition) => transition.from === from && transition.to === to,
  )
}

export function runGuards(
  transition: TransitionDefinition,
  snapshot: EventSnapshot,
  now: Date,
): BlockReason[] {
  return transition.guards.flatMap((guard) => guard(snapshot, now))
}

/**
 * Decides whether the event can move from its current status to `to`.
 * The edge must exist in the transition map and every one of its guards must pass.
 */
export function evaluateTransition(
  snapshot: EventSnapshot,
  to: EventStatus,
  now: Date = new Date(),
): Evaluation {
  const from = snapshot.event.status
  const transition = findTransition(from, to)
  if (!transition) {
    return toEvaluation([
      {
        code: 'invalid_transition',
        message: `An event cannot move from ${STATUS_LABELS[from]} to ${STATUS_LABELS[to]}.`,
      },
    ])
  }
  return toEvaluation(runGuards(transition, snapshot, now))
}
