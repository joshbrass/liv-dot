export type EventStatus =
  'draft' | 'scheduled' | 'ready' | 'live' | 'completed' | 'replay_available'

export type PublishedStatus = Exclude<EventStatus, 'draft'>

/** Lifecycle order, used for display and for telling promotions from regressions. */
export const EVENT_STATUSES: readonly EventStatus[] = [
  'draft',
  'scheduled',
  'ready',
  'live',
  'completed',
  'replay_available',
]

export const STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  ready: 'Ready for Streaming',
  live: 'Live',
  completed: 'Completed',
  replay_available: 'Replay Available',
}

interface EventDetails {
  id: string
  title: string
  description: string
  category: string
  ticketsSold?: number
}

/** A draft may not have a start time yet. */
export interface DraftEvent extends EventDetails {
  status: 'draft'
  startsAt: string | null
}

/** Once scheduled, an event always has a start time (ISO 8601). */
export interface PublishedEvent extends EventDetails {
  status: PublishedStatus
  startsAt: string
}

export type Event = DraftEvent | PublishedEvent
