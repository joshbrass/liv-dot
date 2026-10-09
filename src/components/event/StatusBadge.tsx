import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, type EventStatus } from '@/domain'
import { cn } from '@/lib/utils'
import { STATUS_PILL_CLASSES } from './statusPresentation'

interface StatusBadgeProps {
  status: EventStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        'h-6 gap-1.5 rounded-full px-2.5 text-xs font-medium',
        STATUS_PILL_CLASSES[status],
      )}
    >
      {status === 'live' && (
        <span aria-hidden className="size-1.5 rounded-full bg-live motion-safe:animate-pulse" />
      )}
      <span>
        <span className="sr-only">Status: </span>
        {STATUS_LABELS[status]}
      </span>
    </Badge>
  )
}
