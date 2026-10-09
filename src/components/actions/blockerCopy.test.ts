import { describe, expect, it } from 'vitest'
import type { BlockReason } from '@/domain'
import { toBlockerLines } from './blockerCopy'

const wrongStatus: BlockReason = {
  code: 'wrong_status',
  message: 'The event must be Ready for Streaming to go live.',
}

describe('toBlockerLines', () => {
  it('leads with actionable requirement copy and drops the generic status reason', () => {
    const lines = toBlockerLines([
      wrongStatus,
      { code: 'requirement_unmet', message: 'unused', requirementId: 'pricing' },
    ])

    expect(lines).toEqual([
      {
        key: 'requirement_unmet-pricing',
        text: 'Ticket pricing isn’t set yet. Add a price to continue.',
        requirementId: 'pricing',
      },
    ])
  })

  it('keeps the domain message when no requirement is involved', () => {
    expect(toBlockerLines([wrongStatus]).map(({ text }) => text)).toEqual([wrongStatus.message])
  })
})
