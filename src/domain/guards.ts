import type { BlockReason } from './evaluation'
import { REQUIREMENT_DEFINITIONS, getUnmetRequirements, listRequirements } from './requirements'
import type { EventSnapshot } from './snapshot'

/** A guard returns the reasons a transition is blocked; an empty list means it passes. */
export type Guard = (snapshot: EventSnapshot, now: Date) => BlockReason[]

/** Scheduling needs a valid start time that has not already passed. */
export const requireFutureStartTime: Guard = ({ event }, now) => {
  const startsAt = event.startsAt === null ? Number.NaN : Date.parse(event.startsAt)
  if (Number.isNaN(startsAt)) {
    return [{ code: 'start_time_missing', message: 'Set a start date and time for the event.' }]
  }
  if (startsAt <= now.getTime()) {
    return [{ code: 'start_time_in_past', message: 'The start time must be in the future.' }]
  }
  return []
}

/** Every operational requirement must be satisfied. */
export const requireAllRequirementsMet: Guard = ({ requirements }) =>
  getUnmetRequirements(requirements).map((requirement) => ({
    code: 'requirement_unmet',
    message: REQUIREMENT_DEFINITIONS[requirement.id].unmetMessage,
    requirementId: requirement.id,
  }))

/** Requirements must not be mid-update, so the host acts on settled configuration. */
export const requireNoPendingRequirementChanges: Guard = ({ requirements }) =>
  listRequirements(requirements)
    .filter((requirement) => requirement.request.status === 'pending')
    .map((requirement) => ({
      code: 'requirement_pending',
      message: `${requirement.label} is still being updated.`,
      requirementId: requirement.id,
    }))

/** Regression only applies once at least one requirement has become unmet. */
export const requireSomeRequirementUnmet: Guard = ({ requirements }) =>
  getUnmetRequirements(requirements).length > 0
    ? []
    : [{ code: 'requirements_met', message: 'All requirements are still met.' }]
