import { describe, expect, it } from 'vitest'
import {
  NONE_MET,
  buildDraftEvent,
  buildPublishedEvent,
  buildRequirements,
  buildSnapshot,
} from '@/test/fixtures'
import type { PublishedStatus } from './event'
import { reconcileStatus } from './reconcile'

describe('reconcileStatus', () => {
  it('promotes a scheduled event to ready once every requirement is met', () => {
    const event = buildPublishedEvent('scheduled')

    expect(reconcileStatus(buildSnapshot(event))).toEqual({
      kind: 'promoted',
      event: { ...event, status: 'ready' },
    })
  })

  it('keeps a scheduled event scheduled while a requirement is missing', () => {
    const snapshot = buildSnapshot(
      buildPublishedEvent('scheduled'),
      buildRequirements({ pricing: false }),
    )

    expect(reconcileStatus(snapshot)).toEqual({ kind: 'unchanged' })
  })

  it('regresses a ready event to scheduled and reports which requirements are unmet', () => {
    const event = buildPublishedEvent('ready')
    const snapshot = buildSnapshot(event, buildRequirements({ ingest: false, pricing: false }))

    expect(reconcileStatus(snapshot)).toEqual({
      kind: 'regressed',
      event: { ...event, status: 'scheduled' },
      unmetRequirementIds: ['ingest', 'pricing'],
    })
  })

  it('leaves a ready event alone while every requirement is met', () => {
    expect(reconcileStatus(buildSnapshot(buildPublishedEvent('ready')))).toEqual({
      kind: 'unchanged',
    })
  })

  it('does not promote a draft, even with every requirement met', () => {
    expect(reconcileStatus(buildSnapshot(buildDraftEvent()))).toEqual({ kind: 'unchanged' })
  })

  it.each<PublishedStatus>(['live', 'completed', 'replay_available'])(
    'never changes a %s event, even if requirements become unmet',
    (status) => {
      const snapshot = buildSnapshot(buildPublishedEvent(status), buildRequirements(NONE_MET))

      expect(reconcileStatus(snapshot)).toEqual({ kind: 'unchanged' })
    },
  )

  it('does not mutate the input event', () => {
    const event = buildPublishedEvent('scheduled')
    reconcileStatus(buildSnapshot(event))

    expect(event.status).toBe('scheduled')
  })
})
