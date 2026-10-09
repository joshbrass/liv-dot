import type { BlockReason, RequirementId } from '@/domain'

const UNMET_REQUIREMENT_COPY: Record<RequirementId, string> = {
  crew: 'No production crew is assigned yet. Assign a crew to continue.',
  ingest: 'Streaming ingest isn’t set up yet. Add a stream key to continue.',
  pricing: 'Ticket pricing isn’t set yet. Add a price to continue.',
}

export interface BlockerLine {
  key: string
  text: string
  requirementId?: RequirementId
}

/**
 * Turns the domain's block reasons into short lines for the action card. When a
 * requirement is missing, that is the actionable cause, so the generic "wrong status"
 * reason is left out; the card's status line already says where the event stands.
 */
export function toBlockerLines(reasons: readonly BlockReason[]): BlockerLine[] {
  const hasRequirementReason = reasons.some((reason) => reason.requirementId !== undefined)
  return reasons
    .filter((reason) => !(hasRequirementReason && reason.code === 'wrong_status'))
    .map((reason) => ({
      key: `${reason.code}-${reason.requirementId ?? ''}`,
      text:
        reason.code === 'requirement_unmet'
          ? UNMET_REQUIREMENT_COPY[reason.requirementId]
          : reason.message,
      requirementId: reason.requirementId,
    }))
}
