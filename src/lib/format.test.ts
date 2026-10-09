import { describe, expect, it } from 'vitest'
import { fromDateTimeLocalValue, toDateTimeLocalValue } from './format'

describe('datetime-local conversion', () => {
  it('round-trips an ISO timestamp through the input value', () => {
    const iso = new Date(2026, 5, 8, 19, 30).toISOString()

    expect(toDateTimeLocalValue(iso)).toBe('2026-06-08T19:30')
    expect(fromDateTimeLocalValue('2026-06-08T19:30')).toBe(iso)
  })

  it('treats empty or invalid values as no start time', () => {
    expect(toDateTimeLocalValue(null)).toBe('')
    expect(toDateTimeLocalValue('not-a-date')).toBe('')
    expect(fromDateTimeLocalValue('')).toBeNull()
    expect(fromDateTimeLocalValue('garbage')).toBeNull()
  })
})
