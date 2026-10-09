import { describe, expect, it } from 'vitest'
import { FUTURE_START, buildDraftEvent } from '@/test/fixtures'
import { toPublishedEvent } from './event'

describe('toPublishedEvent', () => {
  it('moves an event with a start time into the given status', () => {
    expect(toPublishedEvent(buildDraftEvent(), 'scheduled')).toMatchObject({
      status: 'scheduled',
      startsAt: FUTURE_START,
    })
  })

  it('refuses to publish an event without a start time', () => {
    expect(() => toPublishedEvent(buildDraftEvent({ startsAt: null }), 'scheduled')).toThrow(
      'An event needs a start time before it can be published.',
    )
  })
})
