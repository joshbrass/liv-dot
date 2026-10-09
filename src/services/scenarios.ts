import type { EventRecord } from './eventApi'

export type ScenarioId =
  'new_draft' | 'scheduled_missing_crew' | 'almost_ready' | 'ready' | 'live' | 'completed'

interface Scenario {
  label: string
  description: string
  build(now: Date): EventRecord
}

const HOUR_MS = 60 * 60 * 1000

function hoursFrom(now: Date, hours: number): string {
  return new Date(now.getTime() + hours * HOUR_MS).toISOString()
}

const details = {
  id: 'evt_midnight_jazz',
  title: 'Midnight Jazz Session',
  description: 'An intimate live set from the Blue Room studio, streamed to ticket holders.',
  category: 'Music',
}

export const SCENARIO_IDS: readonly ScenarioId[] = [
  'new_draft',
  'scheduled_missing_crew',
  'almost_ready',
  'ready',
  'live',
  'completed',
]

export const DEFAULT_SCENARIO: ScenarioId = 'almost_ready'

/** Preset backend states so every lifecycle state can be reviewed in seconds. */
export const SCENARIOS: Record<ScenarioId, Scenario> = {
  new_draft: {
    label: 'New draft',
    description: 'No start time and nothing configured yet.',
    build: () => ({
      event: { ...details, status: 'draft', startsAt: null },
      requirements: { crew: false, ingest: false, pricing: false },
    }),
  },
  scheduled_missing_crew: {
    label: 'Scheduled, missing crew',
    description: 'Scheduled with pricing set; crew and ingest still to do.',
    build: (now) => ({
      event: { ...details, status: 'scheduled', startsAt: hoursFrom(now, 72), ticketsSold: 48 },
      requirements: { crew: false, ingest: false, pricing: true },
    }),
  },
  almost_ready: {
    label: 'Almost ready (1 missing)',
    description: 'Crew and ingest are done; only ticket pricing is missing.',
    build: (now) => ({
      event: { ...details, status: 'scheduled', startsAt: hoursFrom(now, 24), ticketsSold: 0 },
      requirements: { crew: true, ingest: true, pricing: false },
    }),
  },
  ready: {
    label: 'Ready for streaming',
    description: 'Every requirement is met; the host can go live.',
    build: (now) => ({
      event: { ...details, status: 'ready', startsAt: hoursFrom(now, 1), ticketsSold: 212 },
      requirements: { crew: true, ingest: true, pricing: true },
    }),
  },
  live: {
    label: 'Live',
    description: 'The broadcast is on air.',
    build: (now) => ({
      event: { ...details, status: 'live', startsAt: hoursFrom(now, -0.5), ticketsSold: 342 },
      requirements: { crew: true, ingest: true, pricing: true },
    }),
  },
  completed: {
    label: 'Completed',
    description: 'The broadcast has ended; replay is not enabled yet.',
    build: (now) => ({
      event: { ...details, status: 'completed', startsAt: hoursFrom(now, -26), ticketsSold: 342 },
      requirements: { crew: true, ingest: true, pricing: true },
    }),
  },
}
