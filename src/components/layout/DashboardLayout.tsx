import type { ReactNode } from 'react'
import type { EventStatus } from '@/domain'
import { StatusBadge } from '@/components/event/StatusBadge'

interface DashboardLayoutProps {
  /** Null while the event is loading. */
  eventTitle: string | null
  status: EventStatus | null
  children: ReactNode
  /** Rendered outside the main flow (the demo controls drawer). */
  overlay: ReactNode
}

export function DashboardLayout({ eventTitle, status, children, overlay }: DashboardLayoutProps) {
  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-card px-3 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:ring-3 focus:ring-ring/50"
      >
        Skip to main content
      </a>
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 px-4 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:px-6">
          <Logo />
          <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:block">
            <ol className="flex items-center gap-1.5 text-[13px]">
              <li className="text-muted-foreground">Events</li>
              <li aria-hidden className="text-muted-foreground">
                /
              </li>
              <li aria-current="page" className="max-w-[40ch] truncate font-medium">
                {eventTitle ?? 'Loading…'}
              </li>
            </ol>
          </nav>
          <div className="justify-self-end">{status && <StatusBadge status={status} />}</div>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[1200px] space-y-4 px-4 pt-6 pb-20 outline-none sm:px-6"
      >
        {eventTitle === null && <h1 className="sr-only">Event dashboard</h1>}
        {children}
      </main>
      {overlay}
    </div>
  )
}

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="flex size-6 items-center justify-center rounded-md bg-primary">
        <span className="size-2 rounded-full bg-white" />
      </span>
      <span className="text-sm font-semibold tracking-tight">LIV DOT</span>
    </span>
  )
}
