import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import type { RequirementId } from '@/domain'
import { assertNever } from '@/lib/assertNever'
import { toErrorMessage } from '@/lib/errors'
import type { EventApi, EventRecord, RequestOptions } from '@/services/eventApi'
import type { ScenarioId } from '@/services/scenarios'
import { EventDashboardContext, type EventDashboardContextValue } from './eventDashboardContext'
import { eventReducer, initialDashboardState } from './eventReducer'
import type { RetryIntent, TransitionCommand } from './types'

interface EventProviderProps {
  api: EventApi
  children: ReactNode
}

/**
 * Owns the dashboard state and every side effect: it calls the API and dispatches
 * what was requested and what came back. Business rules stay in the domain layer.
 */
export function EventProvider({ api, children }: EventProviderProps) {
  const [state, dispatch] = useReducer(eventReducer, initialDashboardState)
  const stateRef = useRef(state)
  const generationRef = useRef(0)

  useLayoutEffect(() => {
    stateRef.current = state
  })

  /** Request options for the next call, consuming the "fail next request" demo control. */
  const takeRequestOptions = useCallback((): RequestOptions => {
    const forceFailure = stateRef.current.failNextRequest
    if (forceFailure) {
      stateRef.current = { ...stateRef.current, failNextRequest: false }
      dispatch({ type: 'FAILURE_INJECTION_SET', armed: false })
    }
    return { forceFailure }
  }, [])

  const loadWith = useCallback(async (request: () => Promise<EventRecord>) => {
    generationRef.current += 1
    const generation = generationRef.current
    dispatch({ type: 'LOAD_STARTED', generation })
    try {
      dispatch({ type: 'LOAD_SUCCEEDED', generation, record: await request() })
    } catch (error) {
      dispatch({ type: 'LOAD_FAILED', generation, message: toErrorMessage(error) })
    }
  }, [])

  const reload = useCallback(
    () => loadWith(() => api.fetchEvent(takeRequestOptions())),
    [api, loadWith, takeRequestOptions],
  )

  const resetScenario = useCallback(
    (id: ScenarioId) => loadWith(() => api.resetScenario(id)),
    [api, loadWith],
  )

  const setRequirement = useCallback(
    async (requirementId: RequirementId, satisfied: boolean) => {
      const { data } = stateRef.current
      if (
        data.status !== 'loaded' ||
        data.requirements[requirementId].request.status === 'pending'
      ) {
        return
      }
      const generation = generationRef.current
      dispatch({ type: 'REQUIREMENT_UPDATE_STARTED', requirementId })
      try {
        const record = await api.updateRequirement(requirementId, satisfied, takeRequestOptions())
        dispatch({ type: 'REQUIREMENT_UPDATE_SUCCEEDED', generation, requirementId, record })
      } catch (error) {
        dispatch({
          type: 'REQUIREMENT_UPDATE_FAILED',
          generation,
          requirementId,
          satisfied,
          message: toErrorMessage(error),
        })
      }
    },
    [api, takeRequestOptions],
  )

  const runAction = useCallback(
    async (command: TransitionCommand) => {
      const { data } = stateRef.current
      if (data.status !== 'loaded' || data.transition.status === 'pending') return
      const generation = generationRef.current
      dispatch({ type: 'TRANSITION_STARTED', command })
      try {
        const record = await requestTransition(api, command, takeRequestOptions())
        dispatch({ type: 'TRANSITION_SUCCEEDED', generation, command, record })
      } catch (error) {
        dispatch({ type: 'TRANSITION_FAILED', generation, command, message: toErrorMessage(error) })
      }
    },
    [api, takeRequestOptions],
  )

  const retry = useCallback(
    (intent: RetryIntent) => {
      switch (intent.kind) {
        case 'requirement':
          return setRequirement(intent.requirementId, intent.satisfied)
        case 'transition':
          return runAction(intent.command)
        default:
          return assertNever(intent)
      }
    },
    [runAction, setRequirement],
  )

  const simulateStreamFailure = useCallback(async () => {
    const generation = generationRef.current
    try {
      dispatch({
        type: 'STREAM_INTERRUPTED',
        generation,
        record: await api.simulateStreamFailure(),
      })
    } catch (error) {
      dispatch({ type: 'SIMULATION_FAILED', message: toErrorMessage(error) })
    }
  }, [api])

  const dismissNotice = useCallback((id: number) => dispatch({ type: 'NOTICE_DISMISSED', id }), [])

  const setFailNextRequest = useCallback(
    (armed: boolean) => dispatch({ type: 'FAILURE_INJECTION_SET', armed }),
    [],
  )

  useEffect(() => {
    void reload()
  }, [reload])

  const value = useMemo<EventDashboardContextValue>(
    () => ({
      state,
      reload,
      setRequirement,
      runAction,
      retry,
      dismissNotice,
      resetScenario,
      setFailNextRequest,
      simulateStreamFailure,
    }),
    [
      state,
      reload,
      setRequirement,
      runAction,
      retry,
      dismissNotice,
      resetScenario,
      setFailNextRequest,
      simulateStreamFailure,
    ],
  )

  return <EventDashboardContext value={value}>{children}</EventDashboardContext>
}

function requestTransition(
  api: EventApi,
  command: TransitionCommand,
  options: RequestOptions,
): Promise<EventRecord> {
  switch (command.actionId) {
    case 'schedule':
      return api.scheduleEvent(command.startsAt, options)
    case 'goLive':
      return api.goLive(options)
    case 'endStream':
      return api.endStream(options)
    case 'enableReplay':
      return api.enableReplay(options)
    default:
      return assertNever(command)
  }
}
