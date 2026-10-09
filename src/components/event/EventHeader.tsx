import type { ReactNode } from 'react'
import type { Event } from '@/domain'
import { formatDate, formatTime } from '@/lib/format'

interface EventHeaderProps {
  event: Event
}

/** "Midnight Jazz Session" -> "MJ" */
function initialsOf(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

export function EventHeader({ event }: EventHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-[13px] font-semibold"
        >
          {initialsOf(event.title)}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl leading-tight font-semibold">{event.title}</h1>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
            {event.category} · {event.description}
          </p>
        </div>
      </div>

      <dl className="flex flex-wrap gap-x-10 gap-y-3">
        <Metric label="Starts">
          {event.startsAt ? (
            <>
              {formatDate(event.startsAt)} ·{' '}
              <span className="font-mono">{formatTime(event.startsAt)}</span>
            </>
          ) : (
            'Not scheduled'
          )}
        </Metric>
        <Metric label="Tickets sold">{event.ticketsSold?.toLocaleString() ?? '—'}</Metric>
        <Metric label="Venue">Online</Metric>
      </dl>
    </div>
  )
}

function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium tabular-nums">{children}</dd>
    </div>
  )
}
