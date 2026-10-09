import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatClock } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Notice, NoticeTone, RetryIntent } from '@/state/types'

const TONES: Record<NoticeTone, { label: string; dot: string }> = {
  info: { label: 'Info', dot: 'bg-gray-400' },
  success: { label: 'Success', dot: 'bg-success' },
  warning: { label: 'Warning', dot: 'bg-amber-500' },
  error: { label: 'Error', dot: 'bg-destructive' },
}

interface ActivityEntryProps {
  notice: Notice
  seenAt: Date | undefined
  onDismiss: (id: number) => void
  onRetry: (intent: RetryIntent) => void
}

export function ActivityEntry({ notice, seenAt, onDismiss, onRetry }: ActivityEntryProps) {
  const { label, dot } = TONES[notice.tone]
  const { retry } = notice

  return (
    <li className="group relative flex gap-3 pb-4 last:pb-0">
      <span
        aria-hidden
        className="absolute top-4 bottom-0 left-[3.5px] w-px bg-border group-last:hidden"
      />
      <span aria-hidden className={cn('mt-1.5 size-2 shrink-0 rounded-full', dot)} />
      <div role={notice.tone === 'error' ? 'alert' : undefined} className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-medium">
            <span className="sr-only">{label}: </span>
            {notice.title}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {seenAt && (
              <time
                dateTime={seenAt.toISOString()}
                className="font-mono text-xs text-muted-foreground"
              >
                {formatClock(seenAt)}
              </time>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground"
                  aria-label={`Dismiss: ${notice.title}`}
                  onClick={() => onDismiss(notice.id)}
                >
                  <X aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Dismiss</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <p className="text-[13px] text-muted-foreground">{notice.message}</p>
        {retry && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 text-[13px]"
            onClick={() => onRetry(retry)}
          >
            Retry
          </Button>
        )}
      </div>
    </li>
  )
}
