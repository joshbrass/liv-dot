import { EVENT_STATUSES, STATUS_LABELS, type EventStatus } from '@/domain'
import { cn } from '@/lib/utils'

type StepState = 'complete' | 'current' | 'upcoming'

const STEP_STATE_TEXT: Record<StepState, string> = {
  complete: 'completed',
  current: 'current step',
  upcoming: 'upcoming',
}

const STEP_WIDTH_PERCENT = 100 / EVENT_STATUSES.length

interface LifecycleStepperProps {
  status: EventStatus
}

/** Six dots on one line: completed in green, current larger and dark, upcoming grey. */
export function LifecycleStepper({ status }: LifecycleStepperProps) {
  const currentIndex = EVENT_STATUSES.indexOf(status)
  const railInset = `${STEP_WIDTH_PERCENT / 2}%`

  return (
    <nav aria-label="Event lifecycle" className="relative">
      <div
        aria-hidden
        className="absolute top-2 h-px bg-border"
        style={{ left: railInset, right: railInset }}
      />
      <div
        aria-hidden
        className="absolute top-2 h-px bg-success"
        style={{ left: railInset, width: `${currentIndex * STEP_WIDTH_PERCENT}%` }}
      />
      <ol className="relative grid grid-cols-6">
        {EVENT_STATUSES.map((step, index) => {
          const state: StepState =
            index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming'
          return (
            <li
              key={step}
              aria-current={state === 'current' ? 'step' : undefined}
              className="flex flex-col items-center gap-2"
            >
              <span aria-hidden className="flex h-4 items-center">
                <span
                  className={cn(
                    'rounded-full',
                    state === 'complete' && 'size-2.5 bg-success',
                    state === 'current' && 'size-3.5 bg-foreground ring-4 ring-foreground/10',
                    state === 'upcoming' && 'size-2.5 bg-gray-300',
                  )}
                />
              </span>
              <span
                className={cn(
                  'text-center text-xs leading-tight',
                  state === 'current' ? 'font-medium' : 'text-muted-foreground',
                  state !== 'current' && 'sr-only sm:not-sr-only',
                )}
              >
                {STATUS_LABELS[step]}
                <span className="sr-only"> ({STEP_STATE_TEXT[state]})</span>
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
