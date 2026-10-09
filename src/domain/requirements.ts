import { IDLE_REQUEST, type RequestState } from './request'

export type RequirementId = 'crew' | 'ingest' | 'pricing'

export const REQUIREMENT_IDS: readonly RequirementId[] = ['crew', 'ingest', 'pricing']

interface RequirementDefinition {
  label: string
  description: string
  unmetMessage: string
}

export const REQUIREMENT_DEFINITIONS: Record<RequirementId, RequirementDefinition> = {
  crew: {
    label: 'Production crew assigned',
    description: 'A production crew is assigned to run the broadcast.',
    unmetMessage: 'Production crew is not assigned.',
  },
  ingest: {
    label: 'Streaming ingest configured',
    description: 'An ingest endpoint and stream key are configured for the broadcast.',
    unmetMessage: 'Streaming ingest is not configured.',
  },
  pricing: {
    label: 'Ticket pricing configured',
    description: 'Ticket tiers and prices are set so attendees can buy access.',
    unmetMessage: 'Ticket pricing is not configured.',
  },
}

export interface Requirement {
  id: RequirementId
  label: string
  description: string
  satisfied: boolean
  request: RequestState
}

export type Requirements = Readonly<Record<RequirementId, Requirement>>

export function createRequirement(id: RequirementId, satisfied: boolean): Requirement {
  const { label, description } = REQUIREMENT_DEFINITIONS[id]
  return { id, label, description, satisfied, request: IDLE_REQUEST }
}

export function createRequirements(
  satisfied: Readonly<Record<RequirementId, boolean>>,
): Requirements {
  return {
    crew: createRequirement('crew', satisfied.crew),
    ingest: createRequirement('ingest', satisfied.ingest),
    pricing: createRequirement('pricing', satisfied.pricing),
  }
}

/** Requirements in display order. */
export function listRequirements(requirements: Requirements): Requirement[] {
  return REQUIREMENT_IDS.map((id) => requirements[id])
}

/** Requirements that are not yet satisfied, in display order. */
export function getUnmetRequirements(requirements: Requirements): Requirement[] {
  return listRequirements(requirements).filter((requirement) => !requirement.satisfied)
}

/** An event is operationally ready only when every requirement is satisfied. */
export function areAllRequirementsMet(requirements: Requirements): boolean {
  return getUnmetRequirements(requirements).length === 0
}

export interface ReadinessSummary {
  met: number
  total: number
  unmetIds: RequirementId[]
  isComplete: boolean
}

export function getReadinessSummary(requirements: Requirements): ReadinessSummary {
  const unmetIds = getUnmetRequirements(requirements).map((requirement) => requirement.id)
  const total = REQUIREMENT_IDS.length
  return { met: total - unmetIds.length, total, unmetIds, isComplete: unmetIds.length === 0 }
}
