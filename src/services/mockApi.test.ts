import { describe, expect, it } from 'vitest'
import { FUTURE_START, NOW, PAST_START, createTestApi } from '@/test/fixtures'
import { ApiError } from './eventApi'
import { createMockApi } from './mockApi'

describe('createMockApi', () => {
  it('returns the seeded scenario', async () => {
    const record = await createTestApi('ready').fetchEvent()

    expect(record.event.status).toBe('ready')
  })

  it('returns copies, so the client cannot mutate backend state', async () => {
    const api = createTestApi('almost_ready')
    const first = await api.fetchEvent()
    first.requirements.pricing = true

    expect((await api.fetchEvent()).requirements.pricing).toBe(false)
  })

  describe('updateRequirement', () => {
    it('promotes the event to ready when the last requirement is met', async () => {
      const record = await createTestApi('almost_ready').updateRequirement('pricing', true)

      expect(record.requirements.pricing).toBe(true)
      expect(record.event.status).toBe('ready')
    })

    it('regresses a ready event when a requirement is removed', async () => {
      const record = await createTestApi('ready').updateRequirement('ingest', false)

      expect(record.event.status).toBe('scheduled')
    })

    it('rejects changes once the event is live', async () => {
      const api = createTestApi('live')

      await expect(api.updateRequirement('crew', false)).rejects.toThrow(
        'Requirements are locked because the event is Live.',
      )
      expect((await api.fetchEvent()).requirements.crew).toBe(true)
    })
  })

  describe('host actions', () => {
    it('schedules a draft for a future start time', async () => {
      const record = await createTestApi('new_draft').scheduleEvent(FUTURE_START)

      expect(record.event).toMatchObject({ status: 'scheduled', startsAt: FUTURE_START })
    })

    it('rejects a start time in the past with the domain reason', async () => {
      await expect(createTestApi('new_draft').scheduleEvent(PAST_START)).rejects.toThrow(
        'The start time must be in the future.',
      )
    })

    it('refuses to go live while a requirement is missing', async () => {
      await expect(createTestApi('almost_ready').goLive()).rejects.toThrow(
        'An event cannot move from Scheduled to Live.',
      )
    })

    it('walks an event from ready through to replay', async () => {
      const api = createTestApi('ready')

      expect((await api.goLive()).event.status).toBe('live')
      expect((await api.endStream()).event.status).toBe('completed')
      expect((await api.enableReplay()).event.status).toBe('replay_available')
    })
  })

  describe('failure injection', () => {
    it('fails a forced request with an ApiError and leaves state untouched', async () => {
      const api = createTestApi('almost_ready')

      await expect(api.updateRequirement('pricing', true, { forceFailure: true })).rejects.toThrow(
        ApiError,
      )
      expect((await api.fetchEvent()).event.status).toBe('scheduled')
    })

    it('fails requests according to the configured failure rate', async () => {
      const api = createMockApi({
        latencyMs: { min: 0, max: 0 },
        failureRate: 0.5,
        random: () => 0.25,
        now: () => NOW,
      })

      await expect(api.fetchEvent()).rejects.toThrow(
        'The event could not be loaded. The server did not respond in time.',
      )
    })
  })

  describe('demo controls', () => {
    it('ends a live stream when the stream fails', async () => {
      const record = await createTestApi('live').simulateStreamFailure()

      expect(record.event.status).toBe('completed')
    })

    it('rejects a simulated stream failure when the event is not live', async () => {
      await expect(createTestApi('ready').simulateStreamFailure()).rejects.toThrow(
        'The event is not live.',
      )
    })

    it('replaces backend state when a scenario is reset', async () => {
      const api = createTestApi('live')
      await api.resetScenario('new_draft')

      expect((await api.fetchEvent()).event.status).toBe('draft')
    })
  })
})
