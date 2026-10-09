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

/** Moves an event into a published status. Published events always carry a start time. */
export function toPublishedEvent(event: Event, status: PublishedStatus): PublishedEvent {
  if (event.startsAt === null) {
    throw new Error('An event needs a start time before it can be published.')
  }
  return { ...event, status, startsAt: event.startsAt }
}
