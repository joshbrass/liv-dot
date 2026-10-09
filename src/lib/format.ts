const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })

const clockFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

/** e.g. "Sat, Oct 10" */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

/** e.g. "11:41 PM" */
export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso))
}

/** e.g. "11:41:07 PM", for activity timestamps. */
export function formatClock(date: Date): string {
  return clockFormatter.format(date)
}

/** Converts an ISO timestamp to the local `YYYY-MM-DDTHH:mm` value a datetime-local input expects. */
export function toDateTimeLocalValue(iso: string | null): string {
  if (iso === null) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

/** Converts a datetime-local input value (local time) to an ISO timestamp, or null if empty/invalid. */
export function fromDateTimeLocalValue(value: string): string | null {
  if (value === '') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
