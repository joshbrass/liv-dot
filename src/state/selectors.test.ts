import { describe, expect, it } from 'vitest'
import { NOW, buildPublishedEvent, buildRequirements } from '@/test/fixtures'
import { initialDashboardState } from './eventReducer'
import {
  selectAvailableActions,
  selectIsRequirementPending,
  selectLoadedDashboard,
  selectPendingCommand,
  selectReadinessSummary,
  selectRequirementLock,
} from './selectors'
import type { LoadedDashboard } from './types'

function buildLoaded(overrides: Partial<LoadedDashboard> = {}): LoadedDashboard {
  return {
    status: 'loaded',
    event: buildPublishedEvent('scheduled'),
    requirements: buildRequirements({ crew: false }),
    transition: { status: 'idle' },
    ...overrides,
  }
}

describe('selectors', () => {
  it('returns null until the event has loaded', () => {
    expect(selectLoadedDashboard(initialDashboardState)).toBeNull()
  })

  it('derives readiness from the requirements', () => {
    expect(selectReadinessSummary(buildLoaded())).toMatchObject({
      met: 2,
      total: 3,
      unmetIds: ['crew'],
    })
  })

  it('derives the blocked "Go live" action with its reasons', () => {
    const [action] = selectAvailableActions(buildLoaded(), NOW)

    expect(action?.id).toBe('goLive')
    expect(action?.evaluation.allowed).toBe(false)
    expect(action?.evaluation.reasons.map(({ code }) => code)).toEqual([
      'wrong_status',
      'requirement_unmet',
    ])
  })

  it('locks requirements once the event is live', () => {
    const data = buildLoaded({ event: buildPublishedEvent('live') })

    expect(selectRequirementLock(data).allowed).toBe(false)
  })

  it('exposes the pending command only while a transition is in flight', () => {
    const command = { actionId: 'goLive' } as const

    expect(selectPendingCommand(buildLoaded())).toBeNull()
    expect(selectPendingCommand(buildLoaded({ transition: { status: 'pending', command } }))).toBe(
      command,
    )
  })

  it('detects an in-flight requirement update', () => {
    const data = buildLoaded({
      requirements: buildRequirements({}, { ingest: { status: 'pending' } }),
    })

    expect(selectIsRequirementPending(data)).toBe(true)
    expect(selectIsRequirementPending(buildLoaded())).toBe(false)
  })
})
