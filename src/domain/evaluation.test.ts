import { describe, expect, it } from 'vitest'
import { toEvaluation } from './evaluation'

describe('toEvaluation', () => {
  it('is allowed when there are no reasons', () => {
    expect(toEvaluation([])).toEqual({ allowed: true, reasons: [] })
  })

  it('is blocked and keeps every reason in order', () => {
    const reasons = [
      { code: 'start_time_missing', message: 'a' },
      { code: 'requirement_unmet', message: 'b', requirementId: 'crew' },
    ] as const

    expect(toEvaluation(reasons)).toEqual({ allowed: false, reasons })
  })
})
