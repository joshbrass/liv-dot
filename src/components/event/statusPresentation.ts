import type { EventStatus, ReadinessSummary } from '@/domain'

/** Tinted pill fill with darker text of the same hue. */
export const STATUS_PILL_CLASSES: Record<EventStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-amber-50 text-amber-800',
  ready: 'bg-green-50 text-green-800',
  live: 'bg-live/10 text-[#ce2c31]',
  completed: 'bg-gray-100 text-gray-700',
  replay_available: 'bg-blue-50 text-blue-800',
}

/** Title of the action card for each stage of the lifecycle. */
export const ACTION_CARD_TITLES: Record<EventStatus, string> = {
  draft: 'Schedule',
  scheduled: 'Go live',
  ready: 'Go live',
  live: 'Broadcast',
  completed: 'Replay',
  replay_available: 'Replay',
}

/** One sentence telling the host where they stand and what happens next. */
export function describeStatus(status: EventStatus, readiness: ReadinessSummary): string {
  switch (status) {
    case 'draft':
      return 'This event is still a draft. Pick a start time to schedule it.'
    case 'scheduled': {
      const left = readiness.total - readiness.met
      return left === 0
        ? 'All requirements are met. The event will be marked ready shortly.'
        : `${left} ${left === 1 ? 'requirement' : 'requirements'} left before you can go live.`
    }
    case 'ready':
      return 'Everything checks out. You can go live whenever you’re ready.'
    case 'live':
      return 'You’re live. Ticket holders are watching now.'
    case 'completed':
      return 'The stream has ended. Turn on the replay so ticket holders can watch it again.'
    case 'replay_available':
      return 'The replay is available to ticket holders.'
  }
}
