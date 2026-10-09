import { assertNever } from '@/lib/assertNever'
import type { PublishedEvent } from './event'
import { getUnmetRequirements, type RequirementId } from './requirements'
import type { EventSnapshot } from './snapshot'
import { evaluateTransition } from './transitions'

export type Reconciliation =
  | { kind: 'unchanged' }
  | { kind: 'promoted'; event: PublishedEvent }
  | { kind: 'regressed'; event: PublishedEvent; unmetRequirementIds: RequirementId[] }

/**
 * Applies the automatic lifecycle rules after requirements change:
 * a Scheduled event is promoted to Ready once every requirement is met, and a
 * Ready event regresses to Scheduled as soon as any requirement becomes unmet.
 */
export function reconcileStatus(snapshot: EventSnapshot): Reconciliation {
  const { event, requirements } = snapshot
  switch (event.status) {
    case 'scheduled':
      return evaluateTransition(snapshot, 'ready').allowed
        ? { kind: 'promoted', event: { ...event, status: 'ready' } }
        : { kind: 'unchanged' }
    case 'ready':
      return evaluateTransition(snapshot, 'scheduled').allowed
        ? {
            kind: 'regressed',
            event: { ...event, status: 'scheduled' },
            unmetRequirementIds: getUnmetRequirements(requirements).map(({ id }) => id),
          }
        : { kind: 'unchanged' }
    case 'draft':
    case 'live':
    case 'completed':
    case 'replay_available':
      return { kind: 'unchanged' }
    default:
      return assertNever(event)
  }
}
