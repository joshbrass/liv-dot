import { describe, expect, it } from 'vitest'
import { createRequirements, reconcileStatus } from '@/domain'
import { NOW } from '@/test/fixtures'
import { SCENARIOS, SCENARIO_IDS } from './scenarios'

describe('SCENARIOS', () => {
  it.each(SCENARIO_IDS)('%s is already consistent with the lifecycle rules', (id) => {
    const { event, requirements } = SCENARIOS[id].build(NOW)

    expect(reconcileStatus({ event, requirements: createRequirements(requirements) })).toEqual({
      kind: 'unchanged',
    })
  })

  it('covers every lifecycle status a reviewer needs to see', () => {
    const statuses = SCENARIO_IDS.map((id) => SCENARIOS[id].build(NOW).event.status)

    expect(new Set(statuses)).toEqual(new Set(['draft', 'scheduled', 'ready', 'live', 'completed']))
  })

  it('starts the new draft with no start time and nothing configured', () => {
    expect(SCENARIOS.new_draft.build(NOW)).toMatchObject({
      event: { status: 'draft', startsAt: null },
      requirements: { crew: false, ingest: false, pricing: false },
    })
  })

  it('leaves exactly one requirement missing in "Almost ready"', () => {
    const { requirements } = SCENARIOS.almost_ready.build(NOW)

    expect(Object.values(requirements).filter((met) => !met)).toHaveLength(1)
  })

  it('schedules upcoming events in the future relative to "now"', () => {
    const { event } = SCENARIOS.scheduled_missing_crew.build(NOW)

    expect(Date.parse(event.startsAt ?? '')).toBeGreaterThan(NOW.getTime())
  })
})
