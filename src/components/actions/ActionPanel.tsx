import { useState } from 'react'
import type { HostActionId } from '@/domain'
import { cn } from '@/lib/utils'
import {
  selectAvailableActions,
  selectPendingCommand,
  selectReadinessSummary,
} from '@/state/selectors'
import type { LoadedDashboard, TransitionCommand } from '@/state/types'
import { ACTION_CARD_TITLES, describeStatus } from '@/components/event/statusPresentation'
import { ActionButton } from './ActionButton'
import { StartTimeField } from './StartTimeField'

function toCommand(actionId: HostActionId, startsAt: string | null): TransitionCommand | null {
  if (actionId === 'schedule') return startsAt ? { actionId, startsAt } : null
  return { actionId }
}

interface ActionPanelProps {
  data: LoadedDashboard
  onRun: (command: TransitionCommand) => void
  now?: Date
}

/** The "Go live" card: where the event stands, what is blocking it, and the next action. */
export function ActionPanel({ data, onRun, now = new Date() }: ActionPanelProps) {
  const [draftStartsAt, setDraftStartsAt] = useState(data.event.startsAt)
  const { status } = data.event
  const isDraft = status === 'draft'
  const actions = selectAvailableActions(data, now, isDraft ? draftStartsAt : undefined)
  const pending = selectPendingCommand(data)

  return (
    <section
      aria-labelledby="action-panel-title"
      className="space-y-3 rounded-lg border bg-card p-4"
    >
      <div className="space-y-1">
        <h2 id="action-panel-title" className="text-sm font-semibold">
          {ACTION_CARD_TITLES[status]}
        </h2>
        <p className="flex items-start gap-2 text-[13px] text-muted-foreground">
          <span
            aria-hidden
            className={cn(
              'mt-1.5 size-1.5 shrink-0 rounded-full',
              status === 'live' ? 'bg-live motion-safe:animate-pulse' : 'bg-gray-300',
              status === 'ready' && 'bg-success',
            )}
          />
          {describeStatus(status, selectReadinessSummary(data))}
        </p>
      </div>

      {isDraft && <StartTimeField value={draftStartsAt} min={now} onChange={setDraftStartsAt} />}

      {actions.map((action) => (
        <ActionButton
          key={action.id}
          action={action}
          pendingActionId={pending?.actionId ?? null}
          onRun={() => {
            const command = toCommand(action.id, draftStartsAt)
            if (command) onRun(command)
          }}
        />
      ))}

      {data.transition.status === 'error' && (
        <p className="text-[13px] text-destructive">
          Last attempt failed: {data.transition.message}
        </p>
      )}
    </section>
  )
}
