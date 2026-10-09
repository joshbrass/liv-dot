import {
  IDLE_REQUEST,
  createRequirement,
  type RequestState,
  type RequirementId,
  type Requirements,
} from '@/domain'
import { assertNever } from '@/lib/assertNever'
import type { EventRecord } from '@/services/eventApi'
import {
  TRANSITION_NOTICE_KEY,
  requirementFailureNotice,
  requirementNoticeKey,
  simulationFailureNotice,
  statusChangeNotice,
  transitionFailureNotice,
} from './notices'
import type {
  DashboardAction,
  DashboardState,
  LoadedDashboard,
  NoticeDraft,
  StatusChangeCause,
  TransitionState,
} from './types'

export const initialDashboardState: DashboardState = {
  generation: 0,
  data: { status: 'loading' },
  notices: [],
  nextNoticeId: 1,
  failNextRequest: false,
}

const IDLE_TRANSITION: TransitionState = { status: 'idle' }

/**
 * Pure state transitions for the dashboard. Side effects (API calls) live in the provider;
 * this only records what was requested and what the backend answered.
 */
export function eventReducer(state: DashboardState, action: DashboardAction): DashboardState {
  if (isStaleResult(state, action)) return state

  switch (action.type) {
    case 'LOAD_STARTED':
      return {
        ...state,
        generation: action.generation,
        data: { status: 'loading' },
        notices: [],
      }

    case 'LOAD_SUCCEEDED':
      return {
        ...state,
        data: {
          status: 'loaded',
          event: action.record.event,
          requirements: requirementsFromRecord(action.record),
          transition: IDLE_TRANSITION,
        },
      }

    case 'LOAD_FAILED':
      return { ...state, data: { status: 'error', message: action.message } }

    case 'REQUIREMENT_UPDATE_STARTED':
      return withLoaded(state, (data) => ({
        state: removeNotice(state, requirementNoticeKey(action.requirementId)),
        data: {
          ...data,
          requirements: withRequest(data.requirements, action.requirementId, {
            status: 'pending',
          }),
        },
      }))

    case 'REQUIREMENT_UPDATE_SUCCEEDED':
      return withLoaded(state, (data) =>
        applyRecord(state, data, action.record, 'requirement_change', {
          requirementId: action.requirementId,
        }),
      )

    case 'REQUIREMENT_UPDATE_FAILED':
      return withLoaded(state, (data) => ({
        state: addNotice(
          state,
          requirementFailureNotice(action.requirementId, action.satisfied, action.message),
        ),
        data: {
          ...data,
          requirements: withRequest(data.requirements, action.requirementId, {
            status: 'error',
            message: action.message,
          }),
        },
      }))

    case 'TRANSITION_STARTED':
      return withLoaded(state, (data) => ({
        state: removeNotice(state, TRANSITION_NOTICE_KEY),
        data: { ...data, transition: { status: 'pending', command: action.command } },
      }))

    case 'TRANSITION_SUCCEEDED':
      return withLoaded(state, (data) => {
        const next = applyRecord(state, data, action.record, 'host_action')
        return {
          ...next,
          data: { ...next.data, transition: { status: 'success', command: action.command } },
        }
      })

    case 'TRANSITION_FAILED':
      return withLoaded(state, (data) => ({
        state: addNotice(state, transitionFailureNotice(action.command, action.message)),
        data: {
          ...data,
          transition: { status: 'error', command: action.command, message: action.message },
        },
      }))

    case 'STREAM_INTERRUPTED':
      return withLoaded(state, (data) => applyRecord(state, data, action.record, 'stream_failure'))

    case 'SIMULATION_FAILED':
      return addNotice(state, simulationFailureNotice(action.message))

    case 'NOTICE_DISMISSED':
      return { ...state, notices: state.notices.filter(({ id }) => id !== action.id) }

    case 'FAILURE_INJECTION_SET':
      return { ...state, failNextRequest: action.armed }

    default:
      return assertNever(action)
  }
}

/** Results carry the generation they were requested in; anything older has been superseded. */
function isStaleResult(state: DashboardState, action: DashboardAction): boolean {
  return (
    action.type !== 'LOAD_STARTED' &&
    'generation' in action &&
    action.generation !== state.generation
  )
}

interface LoadedUpdate {
  state: DashboardState
  data: LoadedDashboard
}

/** Runs an update only when the event is loaded; otherwise the action has nothing to act on. */
function withLoaded(
  state: DashboardState,
  update: (data: LoadedDashboard) => LoadedUpdate,
): DashboardState {
  if (state.data.status !== 'loaded') return state
  const result = update(state.data)
  return { ...result.state, data: result.data }
}

/** Stores the backend's record and explains any resulting status change with a notice. */
function applyRecord(
  state: DashboardState,
  data: LoadedDashboard,
  record: EventRecord,
  cause: StatusChangeCause,
  settled?: { requirementId: RequirementId },
): LoadedUpdate {
  const requirements = requirementsFromRecord(record, data.requirements, settled?.requirementId)
  const notice = statusChangeNotice(data.event, record.event, requirements, cause)
  return {
    state: notice ? addNotice(state, notice) : state,
    data: { ...data, event: record.event, requirements },
  }
}

/**
 * Builds requirements from the backend flags. In-flight requests on other requirements are
 * preserved; the requirement whose request just settled is marked successful.
 */
function requirementsFromRecord(
  record: EventRecord,
  previous?: Requirements,
  settledId?: RequirementId,
): Requirements {
  const build = (id: RequirementId) => {
    const request: RequestState =
      id === settledId ? { status: 'success' } : (previous?.[id].request ?? IDLE_REQUEST)
    return { ...createRequirement(id, record.requirements[id]), request }
  }
  return { crew: build('crew'), ingest: build('ingest'), pricing: build('pricing') }
}

function withRequest(
  requirements: Requirements,
  id: RequirementId,
  request: RequestState,
): Requirements {
  return { ...requirements, [id]: { ...requirements[id], request } }
}

function addNotice(state: DashboardState, draft: NoticeDraft): DashboardState {
  const others = state.notices.filter(({ key }) => key !== draft.key)
  return {
    ...state,
    notices: [{ ...draft, id: state.nextNoticeId }, ...others],
    nextNoticeId: state.nextNoticeId + 1,
  }
}

function removeNotice(state: DashboardState, key: string): DashboardState {
  return { ...state, notices: state.notices.filter((notice) => notice.key !== key) }
}
