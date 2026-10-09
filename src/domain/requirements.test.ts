import { describe, expect, it } from 'vitest'
import { ALL_MET, NONE_MET, buildRequirements } from '@/test/fixtures'
import {
  areAllRequirementsMet,
  createRequirements,
  getReadinessSummary,
  getUnmetRequirements,
  listRequirements,
} from './requirements'

describe('createRequirements', () => {
  it('builds every requirement with its label and an idle request', () => {
    const requirements = createRequirements(NONE_MET)

    expect(requirements.crew).toEqual({
      id: 'crew',
      label: 'Production crew assigned',
      description: expect.any(String),
      satisfied: false,
      request: { status: 'idle' },
    })
  })
})

describe('listRequirements', () => {
  it('returns requirements in display order', () => {
    const ids = listRequirements(createRequirements(ALL_MET)).map(({ id }) => id)

    expect(ids).toEqual(['crew', 'ingest', 'pricing'])
  })
})

describe('getUnmetRequirements', () => {
  it('returns only unsatisfied requirements, in display order', () => {
    const unmet = getUnmetRequirements(buildRequirements({ pricing: false, crew: false }))

    expect(unmet.map(({ id }) => id)).toEqual(['crew', 'pricing'])
  })

  it('returns an empty list when everything is satisfied', () => {
    expect(getUnmetRequirements(buildRequirements())).toEqual([])
  })
})

describe('areAllRequirementsMet', () => {
  it('is true only when every requirement is satisfied', () => {
    expect(areAllRequirementsMet(buildRequirements())).toBe(true)
    expect(areAllRequirementsMet(buildRequirements({ ingest: false }))).toBe(false)
  })
})

describe('getReadinessSummary', () => {
  it('counts met requirements and lists the unmet ones', () => {
    expect(getReadinessSummary(buildRequirements({ ingest: false }))).toEqual({
      met: 2,
      total: 3,
      unmetIds: ['ingest'],
      isComplete: false,
    })
  })

  it('is complete when all requirements are met', () => {
    expect(getReadinessSummary(buildRequirements())).toMatchObject({ met: 3, isComplete: true })
  })
})
