import { useState } from 'react'

/**
 * Remembers when each id was first rendered. Notices carry no timestamp in state, and the
 * time a host saw something is purely a display concern, so it is tracked here in the UI.
 */
export function useFirstSeenTimes(ids: readonly number[]): ReadonlyMap<number, Date> {
  const [times, setTimes] = useState<ReadonlyMap<number, Date>>(() => new Map())
  const unseen = ids.filter((id) => !times.has(id))

  if (unseen.length > 0) {
    const seenAt = new Date()
    const next = new Map(times)
    for (const id of unseen) next.set(id, seenAt)
    setTimes(next)
  }

  return times
}
