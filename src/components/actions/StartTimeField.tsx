import { useId } from 'react'
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '@/lib/format'

interface StartTimeFieldProps {
  /** ISO timestamp, or null when no time has been entered. */
  value: string | null
  min: Date
  onChange: (startsAt: string | null) => void
}

export function StartTimeField({ value, min, onChange }: StartTimeFieldProps) {
  const id = useId()
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs text-muted-foreground">
        Start date and time
      </label>
      <input
        id={id}
        type="datetime-local"
        value={toDateTimeLocalValue(value)}
        min={toDateTimeLocalValue(min.toISOString())}
        onChange={(event) => onChange(fromDateTimeLocalValue(event.target.value))}
        className="block h-8 w-full rounded-md border bg-card px-2.5 font-mono text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  )
}
