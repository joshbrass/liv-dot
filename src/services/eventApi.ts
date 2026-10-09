import type { Event, RequirementId } from '@/domain'
import type { ScenarioId } from './scenarios'

export type RequirementFlags = Record<RequirementId, boolean>

/** The event as the backend stores it: the event itself plus which requirements are met. */
export interface EventRecord {
  event: Event
  requirements: RequirementFlags
}

export interface RequestOptions {
  /** Demo-only: make this request fail regardless of the configured failure rate. */
  forceFailure?: boolean
}

/** The backend contract. Every mutation resolves with the full, reconciled record. */
export interface EventApi {
  fetchEvent(options?: RequestOptions): Promise<EventRecord>
  updateRequirement(
    id: RequirementId,
    satisfied: boolean,
    options?: RequestOptions,
  ): Promise<EventRecord>
  scheduleEvent(startsAt: string, options?: RequestOptions): Promise<EventRecord>
  goLive(options?: RequestOptions): Promise<EventRecord>
  endStream(options?: RequestOptions): Promise<EventRecord>
  enableReplay(options?: RequestOptions): Promise<EventRecord>
  /** Demo-only: the broadcast drops while live and the backend ends the event. */
  simulateStreamFailure(): Promise<EventRecord>
  /** Demo-only: replace the backend state with a preset scenario. */
  resetScenario(id: ScenarioId): Promise<EventRecord>
}

export class ApiError extends Error {
  override name = 'ApiError'
}
