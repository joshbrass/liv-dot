import {
  TRANSITIONS,
  createRequirements,
  evaluateRequirementChange,
  evaluateTransition,
  reconcileStatus,
  toPublishedEvent,
  type EventSnapshot,
  type HostActionId,
  type RequirementId,
} from '@/domain'
import { ApiError, type EventApi, type EventRecord, type RequestOptions } from './eventApi'
import { DEFAULT_SCENARIO, SCENARIOS, type ScenarioId } from './scenarios'

export interface MockApiConfig {
  /** Artificial latency range in milliseconds. */
  latencyMs?: { min: number; max: number }
  /** Probability (0-1) that any request fails on its own. */
  failureRate?: number
  scenario?: ScenarioId
  random?: () => number
  now?: () => Date
}

const FAILURE_MESSAGES: Record<RequirementId | HostActionId | 'fetch', string> = {
  fetch: 'The event could not be loaded. The server did not respond in time.',
  crew: 'The crew scheduling service is unavailable. Please try again.',
  ingest: 'The streaming provider rejected the ingest configuration. Please try again.',
  pricing: 'Ticket pricing could not be saved. Please try again.',
  schedule: 'The event could not be scheduled. Please try again.',
  goLive: 'The stream could not be started. The ingest server did not respond.',
  endStream: 'The stream could not be stopped. Please try again.',
  enableReplay: 'The replay could not be published. Please try again.',
}

/**
 * An in-memory stand-in for the LIV DOT backend. It owns the event record and enforces
 * the same domain rules the UI displays, so the client can never force an invalid state.
 */
export function createMockApi(config: MockApiConfig = {}): EventApi {
  const {
    latencyMs = { min: 400, max: 1200 },
    failureRate = 0,
    scenario = DEFAULT_SCENARIO,
    random = Math.random,
    now = () => new Date(),
  } = config

  let record = SCENARIOS[scenario].build(now())

  async function respond(
    operation: keyof typeof FAILURE_MESSAGES,
    options: RequestOptions,
    mutate: () => EventRecord = () => record,
  ): Promise<EventRecord> {
    await delay(latencyMs.min + random() * (latencyMs.max - latencyMs.min))
    if (options.forceFailure || random() < failureRate) {
      throw new ApiError(FAILURE_MESSAGES[operation])
    }
    record = mutate()
    return structuredClone(record)
  }

  function applyHostAction(actionId: HostActionId, startsAt?: string): EventRecord {
    const current = toSnapshot(record)
    const event =
      startsAt !== undefined && current.event.status === 'draft'
        ? { ...current.event, startsAt }
        : current.event
    const { to } = TRANSITIONS[actionId]
    const evaluation = evaluateTransition({ ...current, event }, to, now())
    if (!evaluation.allowed) throw new ApiError(evaluation.reasons[0].message)
    return reconcile({ ...record, event: toPublishedEvent(event, to) })
  }

  return {
    fetchEvent: (options = {}) => respond('fetch', options),

    updateRequirement: (id, satisfied, options = {}) =>
      respond(id, options, () => {
        const lock = evaluateRequirementChange(toSnapshot(record))
        if (!lock.allowed) throw new ApiError(lock.reasons[0].message)
        return reconcile({ ...record, requirements: { ...record.requirements, [id]: satisfied } })
      }),

    scheduleEvent: (startsAt, options = {}) =>
      respond('schedule', options, () => applyHostAction('schedule', startsAt)),
    goLive: (options = {}) => respond('goLive', options, () => applyHostAction('goLive')),
    endStream: (options = {}) => respond('endStream', options, () => applyHostAction('endStream')),
    enableReplay: (options = {}) =>
      respond('enableReplay', options, () => applyHostAction('enableReplay')),

    simulateStreamFailure: () =>
      respond('endStream', {}, () => {
        if (record.event.status !== 'live') throw new ApiError('The event is not live.')
        return applyHostAction('endStream')
      }),

    resetScenario: (id) => respond('fetch', {}, () => SCENARIOS[id].build(now())),
  }
}

function toSnapshot(record: EventRecord): EventSnapshot {
  return { event: record.event, requirements: createRequirements(record.requirements) }
}

/** Applies the automatic promotion/regression rule, as the backend would after any change. */
function reconcile(record: EventRecord): EventRecord {
  const result = reconcileStatus(toSnapshot(record))
  return result.kind === 'unchanged' ? record : { ...record, event: result.event }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
