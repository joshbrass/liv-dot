import { describe, expect, it } from 'vitest'
import { buildDraftEvent, buildPublishedEvent, buildRecord } from '@/test/fixtures'
import type { EventRecord } from '@/services/eventApi'
import { eventReducer, initialDashboardState } from './eventReducer'
import type { DashboardAction, DashboardState, LoadedDashboard } from './types'

function reduce(state: DashboardState, ...actions: DashboardAction[]): DashboardState {
  return actions.reduce(eventReducer, state)
}

function loadedWith(record: EventRecord): DashboardState {
  return reduce(
    initialDashboardState,
    { type: 'LOAD_STARTED', generation: 1 },
    { type: 'LOAD_SUCCEEDED', generation: 1, record },
  )
}

function loaded(state: DashboardState): LoadedDashboard {
  if (state.data.status !== 'loaded') throw new Error(`Expected loaded, got ${state.data.status}`)
  return state.data
}

const almostReady = buildRecord(buildPublishedEvent('scheduled'), { pricing: false })
const ready = buildRecord(buildPublishedEvent('ready'))
const NO_CREW_OR_PRICING = { crew: false, pricing: false }

describe('eventReducer', () => {
  describe('loading', () => {
    it('stores the record with idle requests and no transition in flight', () => {
      const data = loaded(loadedWith(almostReady))

      expect(data.event).toEqual(almostReady.event)
      expect(data.requirements.pricing).toMatchObject({
        satisfied: false,
        request: { status: 'idle' },
      })
      expect(data.transition).toEqual({ status: 'idle' })
    })

    it('records a load failure with its message', () => {
      const state = reduce(
        initialDashboardState,
        { type: 'LOAD_STARTED', generation: 1 },
        { type: 'LOAD_FAILED', generation: 1, message: 'Timed out' },
      )

      expect(state.data).toEqual({ status: 'error', message: 'Timed out' })
    })

    it('clears notices when a new load starts', () => {
      const withNotice = reduce(loadedWith(almostReady), {
        type: 'SIMULATION_FAILED',
        message: 'x',
      })

      expect(reduce(withNotice, { type: 'LOAD_STARTED', generation: 2 }).notices).toEqual([])
    })
  })

  describe('stale responses', () => {
    it('ignores a load result from a superseded generation', () => {
      const state = reduce(
        initialDashboardState,
        { type: 'LOAD_STARTED', generation: 1 },
        { type: 'LOAD_STARTED', generation: 2 },
        { type: 'LOAD_SUCCEEDED', generation: 1, record: ready },
      )

      expect(state.data.status).toBe('loading')
    })

    it('ignores a requirement result that arrives after a scenario reset', () => {
      const reset = reduce(
        loadedWith(almostReady),
        { type: 'REQUIREMENT_UPDATE_STARTED', requirementId: 'pricing' },
        { type: 'LOAD_STARTED', generation: 2 },
        { type: 'LOAD_SUCCEEDED', generation: 2, record: almostReady },
      )
      const state = eventReducer(reset, {
        type: 'REQUIREMENT_UPDATE_SUCCEEDED',
        generation: 1,
        requirementId: 'pricing',
        record: ready,
      })

      expect(state).toBe(reset)
    })
  })

  describe('requirement updates', () => {
    it('marks the requirement pending while the request is in flight', () => {
      const state = reduce(loadedWith(almostReady), {
        type: 'REQUIREMENT_UPDATE_STARTED',
        requirementId: 'pricing',
      })

      expect(loaded(state).requirements.pricing.request).toEqual({ status: 'pending' })
    })

    it('applies a successful update and announces the promotion to ready', () => {
      const state = reduce(
        loadedWith(almostReady),
        { type: 'REQUIREMENT_UPDATE_STARTED', requirementId: 'pricing' },
        {
          type: 'REQUIREMENT_UPDATE_SUCCEEDED',
          generation: 1,
          requirementId: 'pricing',
          record: ready,
        },
      )

      expect(loaded(state).event.status).toBe('ready')
      expect(loaded(state).requirements.pricing).toMatchObject({
        satisfied: true,
        request: { status: 'success' },
      })
      expect(state.notices).toEqual([
        expect.objectContaining({ tone: 'success', title: 'Ready for streaming' }),
      ])
    })

    it('explains a regression with the requirement that became unmet', () => {
      const regressed = buildRecord(buildPublishedEvent('scheduled'), { ingest: false })
      const state = reduce(
        loadedWith(ready),
        { type: 'REQUIREMENT_UPDATE_STARTED', requirementId: 'ingest' },
        {
          type: 'REQUIREMENT_UPDATE_SUCCEEDED',
          generation: 1,
          requirementId: 'ingest',
          record: regressed,
        },
      )

      expect(state.notices[0]).toMatchObject({
        tone: 'warning',
        title: 'Moved back to Scheduled',
        message: 'The event is no longer ready for streaming. Streaming ingest is not configured.',
      })
    })

    it('keeps other in-flight requests pending when one settles', () => {
      const state = reduce(
        loadedWith(buildRecord(buildPublishedEvent('scheduled'), NO_CREW_OR_PRICING)),
        { type: 'REQUIREMENT_UPDATE_STARTED', requirementId: 'crew' },
        { type: 'REQUIREMENT_UPDATE_STARTED', requirementId: 'pricing' },
        {
          type: 'REQUIREMENT_UPDATE_SUCCEEDED',
          generation: 1,
          requirementId: 'crew',
          record: buildRecord(buildPublishedEvent('scheduled'), { pricing: false }),
        },
      )

      expect(loaded(state).requirements.pricing.request).toEqual({ status: 'pending' })
    })

    it('records a failure on the requirement and offers a retry', () => {
      const state = reduce(
        loadedWith(almostReady),
        { type: 'REQUIREMENT_UPDATE_STARTED', requirementId: 'pricing' },
        {
          type: 'REQUIREMENT_UPDATE_FAILED',
          generation: 1,
          requirementId: 'pricing',
          satisfied: true,
          message: 'Service unavailable',
        },
      )

      expect(loaded(state).requirements.pricing).toMatchObject({
        satisfied: false,
        request: { status: 'error', message: 'Service unavailable' },
      })
      expect(state.notices).toEqual([
        expect.objectContaining({
          tone: 'error',
          title: 'Ticket pricing update failed',
          retry: { kind: 'requirement', requirementId: 'pricing', satisfied: true },
        }),
      ])
    })

    it('clears the failure notice when the requirement is retried', () => {
      const failed = reduce(
        loadedWith(almostReady),
        { type: 'REQUIREMENT_UPDATE_STARTED', requirementId: 'pricing' },
        {
          type: 'REQUIREMENT_UPDATE_FAILED',
          generation: 1,
          requirementId: 'pricing',
          satisfied: true,
          message: 'Service unavailable',
        },
      )
      const retried = eventReducer(failed, {
        type: 'REQUIREMENT_UPDATE_STARTED',
        requirementId: 'pricing',
      })

      expect(retried.notices).toEqual([])
    })
  })

  describe('transitions', () => {
    const goLive = { actionId: 'goLive' } as const

    it('tracks the pending command', () => {
      const state = reduce(loadedWith(ready), { type: 'TRANSITION_STARTED', command: goLive })

      expect(loaded(state).transition).toEqual({ status: 'pending', command: goLive })
    })

    it('applies the new status on success and announces it', () => {
      const state = reduce(
        loadedWith(ready),
        { type: 'TRANSITION_STARTED', command: goLive },
        {
          type: 'TRANSITION_SUCCEEDED',
          generation: 1,
          command: goLive,
          record: buildRecord(buildPublishedEvent('live')),
        },
      )

      expect(loaded(state).event.status).toBe('live')
      expect(loaded(state).transition).toEqual({ status: 'success', command: goLive })
      expect(state.notices[0]).toMatchObject({ title: 'You are live' })
    })

    it('keeps the status and offers a retry on failure', () => {
      const state = reduce(
        loadedWith(ready),
        { type: 'TRANSITION_STARTED', command: goLive },
        { type: 'TRANSITION_FAILED', generation: 1, command: goLive, message: 'Ingest down' },
      )

      expect(loaded(state).event.status).toBe('ready')
      expect(loaded(state).transition).toEqual({
        status: 'error',
        command: goLive,
        message: 'Ingest down',
      })
      expect(state.notices[0]).toMatchObject({
        title: 'Go live failed',
        retry: { kind: 'transition', command: goLive },
      })
    })

    it('announces a scheduled draft', () => {
      const command = { actionId: 'schedule', startsAt: '2026-06-08T18:00:00.000Z' } as const
      const state = reduce(
        loadedWith(buildRecord(buildDraftEvent(), NO_CREW_OR_PRICING)),
        { type: 'TRANSITION_STARTED', command },
        {
          type: 'TRANSITION_SUCCEEDED',
          generation: 1,
          command,
          record: buildRecord(buildPublishedEvent('scheduled'), NO_CREW_OR_PRICING),
        },
      )

      expect(state.notices[0]).toMatchObject({ tone: 'info', title: 'Event scheduled' })
    })
  })

  describe('stream interruption', () => {
    it('ends the event and explains that the stream dropped', () => {
      const state = reduce(loadedWith(buildRecord(buildPublishedEvent('live'))), {
        type: 'STREAM_INTERRUPTED',
        generation: 1,
        record: buildRecord(buildPublishedEvent('completed')),
      })

      expect(loaded(state).event.status).toBe('completed')
      expect(state.notices[0]).toMatchObject({ tone: 'error', title: 'Stream interrupted' })
    })
  })

  describe('notices', () => {
    it('replaces an older notice with the same key instead of stacking', () => {
      const state = reduce(
        loadedWith(ready),
        { type: 'SIMULATION_FAILED', message: 'first' },
        { type: 'SIMULATION_FAILED', message: 'second' },
      )

      expect(state.notices.map(({ message }) => message)).toEqual(['second'])
    })

    it('dismisses a notice by id', () => {
      const withNotice = reduce(loadedWith(ready), { type: 'SIMULATION_FAILED', message: 'x' })
      const id = withNotice.notices[0]?.id ?? -1

      expect(eventReducer(withNotice, { type: 'NOTICE_DISMISSED', id }).notices).toEqual([])
    })
  })

  it('arms and disarms failure injection', () => {
    const armed = eventReducer(initialDashboardState, {
      type: 'FAILURE_INJECTION_SET',
      armed: true,
    })

    expect(armed.failNextRequest).toBe(true)
    expect(
      eventReducer(armed, { type: 'FAILURE_INJECTION_SET', armed: false }).failNextRequest,
    ).toBe(false)
  })

  it('ignores requirement and transition actions before the event has loaded', () => {
    const state = eventReducer(initialDashboardState, {
      type: 'REQUIREMENT_UPDATE_STARTED',
      requirementId: 'crew',
    })

    expect(state).toBe(initialDashboardState)
  })
})
