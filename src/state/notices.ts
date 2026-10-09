import {
  HOST_ACTION_LABELS,
  REQUIREMENT_DEFINITIONS,
  getUnmetRequirements,
  type Event,
  type RequirementId,
  type Requirements,
} from '@/domain'
import { assertNever } from '@/lib/assertNever'
import type { NoticeDraft, StatusChangeCause, TransitionCommand } from './types'

export const STATUS_NOTICE_KEY = 'status'
export const TRANSITION_NOTICE_KEY = 'transition'
export const SIMULATION_NOTICE_KEY = 'simulation'

export function requirementNoticeKey(id: RequirementId): string {
  return `requirement:${id}`
}

/** Explains a lifecycle status change to the host, or returns null if the status is unchanged. */
export function statusChangeNotice(
  previous: Event,
  next: Event,
  requirements: Requirements,
  cause: StatusChangeCause,
): NoticeDraft | null {
  if (previous.status === next.status) return null
  const notice = (tone: NoticeDraft['tone'], title: string, message: string): NoticeDraft => ({
    key: STATUS_NOTICE_KEY,
    tone,
    title,
    message,
  })

  switch (next.status) {
    case 'draft':
      return null
    case 'scheduled': {
      if (previous.status !== 'ready') {
        return notice(
          'info',
          'Event scheduled',
          'Complete the remaining requirements to get ready for streaming.',
        )
      }
      const missing = getUnmetRequirements(requirements)
        .map(({ id }) => REQUIREMENT_DEFINITIONS[id].unmetMessage)
        .join(' ')
      return notice(
        'warning',
        'Moved back to Scheduled',
        `The event is no longer ready for streaming. ${missing}`,
      )
    }
    case 'ready':
      return notice(
        'success',
        'Ready for streaming',
        'All requirements are met. You can go live whenever you are ready.',
      )
    case 'live':
      return notice('success', 'You are live', 'The broadcast has started for ticket holders.')
    case 'completed':
      return cause === 'stream_failure'
        ? notice(
            'error',
            'Stream interrupted',
            'The broadcast ended unexpectedly, so the event has been marked as completed.',
          )
        : notice('info', 'Stream ended', 'The broadcast is over. You can now enable the replay.')
    case 'replay_available':
      return notice('success', 'Replay enabled', 'Ticket holders can now watch the replay.')
    default:
      return assertNever(next)
  }
}

export function requirementFailureNotice(
  requirementId: RequirementId,
  satisfied: boolean,
  message: string,
): NoticeDraft {
  return {
    key: requirementNoticeKey(requirementId),
    tone: 'error',
    title: `${REQUIREMENT_DEFINITIONS[requirementId].name} update failed`,
    message,
    retry: { kind: 'requirement', requirementId, satisfied },
  }
}

export function transitionFailureNotice(command: TransitionCommand, message: string): NoticeDraft {
  return {
    key: TRANSITION_NOTICE_KEY,
    tone: 'error',
    title: `${HOST_ACTION_LABELS[command.actionId]} failed`,
    message,
    retry: { kind: 'transition', command },
  }
}

export function simulationFailureNotice(message: string): NoticeDraft {
  return { key: SIMULATION_NOTICE_KEY, tone: 'error', title: 'Simulation failed', message }
}
