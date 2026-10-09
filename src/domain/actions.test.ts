import { describe, expect, it } from 'vitest'
import {
  NONE_MET,
  NOW,
  buildDraftEvent,
  buildPublishedEvent,
  buildRequirements,
  buildSnapshot,
} from '@/test/fixtures'
import { evaluateHostAction, evaluateRequirementChange, getAvailableActions } from './actions'
import type { PublishedStatus } from './event'

describe('getAvailableActions', () => {
  it.each([
    ['scheduled', 'goLive'],
    ['ready', 'goLive'],
    ['live', 'endStream'],
    ['completed', 'enableReplay'],
  ] as const)('offers the right host action in %s', (status, actionId) => {
    const actions = getAvailableActions(buildSnapshot(buildPublishedEvent(status)), NOW)

    expect(actions.map(({ id }) => id)).toEqual([actionId])
  })

  it('offers scheduling for a draft', () => {
    const [action] = getAvailableActions(buildSnapshot(buildDraftEvent()), NOW)

    expect(action).toEqual({
      id: 'schedule',
      label: 'Schedule event',
      target: 'scheduled',
      evaluation: { allowed: true, reasons: [] },
    })
  })

  it('offers nothing once the replay is available', () => {
    expect(
      getAvailableActions(buildSnapshot(buildPublishedEvent('replay_available')), NOW),
    ).toEqual([])
  })

  it('allows going live from ready when everything is met', () => {
    const [action] = getAvailableActions(buildSnapshot(buildPublishedEvent('ready')), NOW)

    expect(action?.evaluation.allowed).toBe(true)
  })
})

describe('evaluateHostAction', () => {
  it('explains why "Go live" is blocked while the event is only scheduled', () => {
    const snapshot = buildSnapshot(
      buildPublishedEvent('scheduled'),
      buildRequirements({ crew: false }),
    )

    expect(evaluateHostAction(snapshot, 'goLive', NOW)).toEqual({
      allowed: false,
      reasons: [
        {
          code: 'wrong_status',
          message: 'The event must be Ready for Streaming to go live.',
        },
        {
          code: 'requirement_unmet',
          message: 'Production crew is not assigned.',
          requirementId: 'crew',
        },
      ],
    })
  })

  it('lists every missing requirement when nothing is configured', () => {
    const snapshot = buildSnapshot(buildPublishedEvent('scheduled'), buildRequirements(NONE_MET))
    const linked = evaluateHostAction(snapshot, 'goLive', NOW).reasons.map(
      (reason) => reason.requirementId,
    )

    expect(linked).toEqual([undefined, 'crew', 'ingest', 'pricing'])
  })

  it('delegates to the transition guards when in the source status', () => {
    const snapshot = buildSnapshot(buildDraftEvent({ startsAt: null }))

    expect(evaluateHostAction(snapshot, 'schedule', NOW).reasons.map(({ code }) => code)).toEqual([
      'start_time_missing',
    ])
  })
})

describe('evaluateRequirementChange', () => {
  it('allows changes before the event goes live', () => {
    expect(evaluateRequirementChange(buildSnapshot(buildDraftEvent())).allowed).toBe(true)
    expect(evaluateRequirementChange(buildSnapshot(buildPublishedEvent('scheduled'))).allowed).toBe(
      true,
    )
    expect(evaluateRequirementChange(buildSnapshot(buildPublishedEvent('ready'))).allowed).toBe(
      true,
    )
  })

  it.each<PublishedStatus>(['live', 'completed', 'replay_available'])(
    'locks requirements once the event is %s',
    (status) => {
      const result = evaluateRequirementChange(buildSnapshot(buildPublishedEvent(status)))

      expect(result.allowed).toBe(false)
      expect(result.reasons[0]?.code).toBe('requirements_locked')
    },
  )

  it('names the current status in the lock message', () => {
    const result = evaluateRequirementChange(buildSnapshot(buildPublishedEvent('live')))

    expect(result.reasons[0]?.message).toBe('Requirements are locked because the event is Live.')
  })
})
