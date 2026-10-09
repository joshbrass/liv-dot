import type { Event, HostActionId, RequirementId, Requirements } from '@/domain'
import type { EventRecord } from '@/services/eventApi'

/** A host action plus the input it needs. Scheduling is the only action that takes input. */
export type TransitionCommand =
  { actionId: 'schedule'; startsAt: string } | { actionId: Exclude<HostActionId, 'schedule'> }

export type TransitionState =
  | { status: 'idle' }
  | { status: 'pending'; command: TransitionCommand }
  | { status: 'success'; command: TransitionCommand }
  | { status: 'error'; command: TransitionCommand; message: string }

/** What a "Retry" button should re-run. Stored as data so notices stay serializable. */
export type RetryIntent =
  | { kind: 'requirement'; requirementId: RequirementId; satisfied: boolean }
  | { kind: 'transition'; command: TransitionCommand }

export type NoticeTone = 'info' | 'success' | 'warning' | 'error'

export interface Notice {
  id: number
  /** Notices sharing a key replace each other, so the list never shows stale duplicates. */
  key: string
  tone: NoticeTone
  title: string
  message: string
  retry?: RetryIntent
}

export type NoticeDraft = Omit<Notice, 'id'>

export type DashboardData =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; event: Event; requirements: Requirements; transition: TransitionState }

export type LoadedDashboard = Extract<DashboardData, { status: 'loaded' }>

export interface DashboardState {
  /** Incremented on every (re)load; results from an older generation are ignored. */
  generation: number
  data: DashboardData
  notices: Notice[]
  nextNoticeId: number
  /** Demo control: the next API request will fail. */
  failNextRequest: boolean
}

export type StatusChangeCause = 'host_action' | 'requirement_change' | 'stream_failure'

export type DashboardAction =
  | { type: 'LOAD_STARTED'; generation: number }
  | { type: 'LOAD_SUCCEEDED'; generation: number; record: EventRecord }
  | { type: 'LOAD_FAILED'; generation: number; message: string }
  | { type: 'REQUIREMENT_UPDATE_STARTED'; requirementId: RequirementId }
  | {
      type: 'REQUIREMENT_UPDATE_SUCCEEDED'
      generation: number
      requirementId: RequirementId
      record: EventRecord
    }
  | {
      type: 'REQUIREMENT_UPDATE_FAILED'
      generation: number
      requirementId: RequirementId
      satisfied: boolean
      message: string
    }
  | { type: 'TRANSITION_STARTED'; command: TransitionCommand }
  | {
      type: 'TRANSITION_SUCCEEDED'
      generation: number
      command: TransitionCommand
      record: EventRecord
    }
  | { type: 'TRANSITION_FAILED'; generation: number; command: TransitionCommand; message: string }
  | { type: 'STREAM_INTERRUPTED'; generation: number; record: EventRecord }
  | { type: 'SIMULATION_FAILED'; message: string }
  | { type: 'NOTICE_DISMISSED'; id: number }
  | { type: 'FAILURE_INJECTION_SET'; armed: boolean }
