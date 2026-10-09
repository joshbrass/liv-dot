import {
  createRequirements,
  type DraftEvent,
  type EventSnapshot,
  type PublishedEvent,
  type PublishedStatus,
  type RequestState,
  type RequirementId,
  type Requirements,
} from '@/domain'

export const NOW = new Date('2026-06-01T12:00:00.000Z')
export const FUTURE_START = '2026-06-08T18:00:00.000Z'
export const PAST_START = '2026-05-25T18:00:00.000Z'

const details = {
  id: 'evt_1',
  title: 'Midnight Jazz Session',
  description: 'An intimate live set streamed from the studio.',
  category: 'Music',
}

export function buildDraftEvent(overrides: Partial<DraftEvent> = {}): DraftEvent {
  return { ...details, status: 'draft', startsAt: FUTURE_START, ...overrides }
}

export function buildPublishedEvent(
  status: PublishedStatus,
  overrides: Partial<Omit<PublishedEvent, 'status'>> = {},
): PublishedEvent {
  return { ...details, status, startsAt: FUTURE_START, ticketsSold: 120, ...overrides }
}

export const ALL_MET: Record<RequirementId, boolean> = { crew: true, ingest: true, pricing: true }
export const NONE_MET: Record<RequirementId, boolean> = {
  crew: false,
  ingest: false,
  pricing: false,
}

export function buildRequirements(
  satisfied: Partial<Record<RequirementId, boolean>> = {},
  requests: Partial<Record<RequirementId, RequestState>> = {},
): Requirements {
  const requirements = createRequirements({ ...ALL_MET, ...satisfied })
  return {
    crew: { ...requirements.crew, request: requests.crew ?? requirements.crew.request },
    ingest: { ...requirements.ingest, request: requests.ingest ?? requirements.ingest.request },
    pricing: { ...requirements.pricing, request: requests.pricing ?? requirements.pricing.request },
  }
}

export function buildSnapshot(
  event: EventSnapshot['event'],
  requirements: Requirements = buildRequirements(),
): EventSnapshot {
  return { event, requirements }
}
