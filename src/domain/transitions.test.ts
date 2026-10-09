import { describe, expect, it } from 'vitest'
import {
  NONE_MET,
  NOW,
  PAST_START,
  buildDraftEvent,
  buildPublishedEvent,
  buildRequirements,
  buildSnapshot,
} from '@/test/fixtures'
import type { EventStatus, PublishedStatus } from './event'
import { evaluateTransition, findTransition } from './transitions'

describe('evaluateTransition', () => {
  describe('draft -> scheduled', () => {
    it('is allowed when the start time is in the future', () => {
      const snapshot = buildSnapshot(buildDraftEvent(), buildRequirements(NONE_MET))

      expect(evaluateTransition(snapshot, 'scheduled', NOW)).toEqual({
        allowed: true,
        reasons: [],
      })
    })

    it('is blocked when no start time is set', () => {
      const snapshot = buildSnapshot(buildDraftEvent({ startsAt: null }))

      expect(evaluateTransition(snapshot, 'scheduled', NOW)).toEqual({
        allowed: false,
        reasons: [
          { code: 'start_time_missing', message: 'Set a start date and time for the event.' },
        ],
      })
    })

    it('is blocked when the start time is not a valid date', () => {
      const snapshot = buildSnapshot(buildDraftEvent({ startsAt: 'not-a-date' }))

      expect(evaluateTransition(snapshot, 'scheduled', NOW).reasons[0]?.code).toBe(
        'start_time_missing',
      )
    })

    it('is blocked when the start time is in the past', () => {
      const snapshot = buildSnapshot(buildDraftEvent({ startsAt: PAST_START }))

      expect(evaluateTransition(snapshot, 'scheduled', NOW)).toEqual({
        allowed: false,
        reasons: [{ code: 'start_time_in_past', message: 'The start time must be in the future.' }],
      })
    })

    it('is blocked when the start time is exactly now', () => {
      const snapshot = buildSnapshot(buildDraftEvent({ startsAt: NOW.toISOString() }))

      expect(evaluateTransition(snapshot, 'scheduled', NOW).allowed).toBe(false)
    })
  })

  describe('scheduled -> ready', () => {
    it('is allowed when every requirement is met', () => {
      const snapshot = buildSnapshot(buildPublishedEvent('scheduled'))

      expect(evaluateTransition(snapshot, 'ready', NOW).allowed).toBe(true)
    })

    it('lists each unmet requirement as a reason linked to that requirement', () => {
      const snapshot = buildSnapshot(
        buildPublishedEvent('scheduled'),
        buildRequirements({ crew: false, pricing: false }),
      )

      expect(evaluateTransition(snapshot, 'ready', NOW).reasons).toEqual([
        {
          code: 'requirement_unmet',
          message: 'Production crew is not assigned.',
          requirementId: 'crew',
        },
        {
          code: 'requirement_unmet',
          message: 'Ticket pricing is not configured.',
          requirementId: 'pricing',
        },
      ])
    })
  })

  describe('ready -> scheduled (regression)', () => {
    it('is allowed once any requirement is unmet', () => {
      const snapshot = buildSnapshot(
        buildPublishedEvent('ready'),
        buildRequirements({ ingest: false }),
      )

      expect(evaluateTransition(snapshot, 'scheduled', NOW).allowed).toBe(true)
    })

    it('is blocked while every requirement is still met', () => {
      const snapshot = buildSnapshot(buildPublishedEvent('ready'))

      expect(evaluateTransition(snapshot, 'scheduled', NOW).reasons).toEqual([
        { code: 'requirements_met', message: 'All requirements are still met.' },
      ])
    })
  })

  describe('ready -> live', () => {
    it('is allowed when every requirement is met and settled', () => {
      const snapshot = buildSnapshot(buildPublishedEvent('ready'))

      expect(evaluateTransition(snapshot, 'live', NOW).allowed).toBe(true)
    })

    it('is blocked when a requirement is unmet', () => {
      const snapshot = buildSnapshot(
        buildPublishedEvent('ready'),
        buildRequirements({ ingest: false }),
      )

      expect(evaluateTransition(snapshot, 'live', NOW).reasons).toEqual([
        {
          code: 'requirement_unmet',
          message: 'Streaming ingest is not configured.',
          requirementId: 'ingest',
        },
      ])
    })

    it('is blocked while a requirement change is still pending', () => {
      const snapshot = buildSnapshot(
        buildPublishedEvent('ready'),
        buildRequirements({}, { crew: { status: 'pending' } }),
      )

      expect(evaluateTransition(snapshot, 'live', NOW).reasons).toEqual([
        {
          code: 'requirement_pending',
          message: 'Production crew assigned is still being updated.',
          requirementId: 'crew',
        },
      ])
    })
  })

  it.each<[PublishedStatus, EventStatus]>([
    ['live', 'completed'],
    ['completed', 'replay_available'],
  ])('allows %s -> %s unconditionally', (from, to) => {
    const snapshot = buildSnapshot(buildPublishedEvent(from))

    expect(evaluateTransition(snapshot, to, NOW)).toEqual({ allowed: true, reasons: [] })
  })

  it.each<[EventStatus, EventStatus]>([
    ['draft', 'live'],
    ['scheduled', 'live'],
    ['live', 'scheduled'],
    ['completed', 'live'],
    ['replay_available', 'completed'],
  ])('rejects the undefined edge %s -> %s', (from, to) => {
    const event = from === 'draft' ? buildDraftEvent() : buildPublishedEvent(from)
    const result = evaluateTransition(buildSnapshot(event), to, NOW)

    expect(result.allowed).toBe(false)
    expect(result.reasons).toEqual([{ code: 'invalid_transition', message: expect.any(String) }])
  })

  it('names both statuses in the invalid transition message', () => {
    const snapshot = buildSnapshot(buildPublishedEvent('scheduled'))

    expect(evaluateTransition(snapshot, 'live', NOW).reasons[0]?.message).toBe(
      'An event cannot move from Scheduled to Live.',
    )
  })
})

describe('findTransition', () => {
  it('returns the edge definition when one exists', () => {
    expect(findTransition('ready', 'live')).toMatchObject({ trigger: 'host' })
    expect(findTransition('scheduled', 'ready')).toMatchObject({ trigger: 'system' })
  })

  it('returns undefined for an undefined edge', () => {
    expect(findTransition('draft', 'completed')).toBeUndefined()
  })
})
