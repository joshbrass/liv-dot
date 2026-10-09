import type { Event } from './event'
import type { Requirements } from './requirements'

/** The source-of-truth inputs every lifecycle rule is evaluated against. */
export interface EventSnapshot {
  event: Event
  requirements: Requirements
}
