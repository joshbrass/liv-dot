import { LoaderCircle } from 'lucide-react'
import { useId } from 'react'
import { Button } from '@/components/ui/button'
import type { AvailableAction, HostActionId } from '@/domain'
import { BlockReasonList } from './BlockReasonList'

const PENDING_LABELS: Record<HostActionId, string> = {
  schedule: 'Scheduling…',
  goLive: 'Going live…',
  endStream: 'Ending stream…',
  enableReplay: 'Enabling replay…',
}

interface ActionButtonProps {
  action: AvailableAction
  pendingActionId: HostActionId | null
  onRun: () => void
}

/**
 * A blocked action renders as a small, muted outline button with its blockers beside it.
 * It uses aria-disabled rather than disabled so it stays focusable and screen readers
 * can reach the blockers it is described by.
 */
export function ActionButton({ action, pendingActionId, onRun }: ActionButtonProps) {
  const reasonsId = useId()
  const { evaluation } = action
  const isPending = pendingActionId === action.id
  const isBusy = pendingActionId !== null

  if (!evaluation.allowed) {
    return (
      <div className="flex items-start gap-3">
        <Button
          variant="outline"
          size="sm"
          className="h-7 shrink-0 cursor-not-allowed text-[13px] text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
          aria-disabled
          aria-describedby={reasonsId}
        >
          {action.label}
        </Button>
        <BlockReasonList id={reasonsId} reasons={evaluation.reasons} />
      </div>
    )
  }

  return (
    <Button
      className="aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
      aria-disabled={isBusy}
      aria-busy={isPending}
      onClick={() => {
        if (!isBusy) onRun()
      }}
    >
      {isPending && <LoaderCircle aria-hidden className="animate-spin" />}
      {isPending ? PENDING_LABELS[action.id] : action.label}
    </Button>
  )
}
