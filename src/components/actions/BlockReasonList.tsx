import type { BlockReason } from '@/domain'
import { requirementAnchorId } from '@/components/readiness/requirementAnchor'
import { toBlockerLines } from './blockerCopy'

interface BlockReasonListProps {
  id: string
  reasons: readonly BlockReason[]
}

/** Short blocker lines; requirement blockers link to their checklist row. */
export function BlockReasonList({ id, reasons }: BlockReasonListProps) {
  return (
    <ul id={id} className="min-w-0 space-y-1 text-[13px] leading-5 text-muted-foreground">
      {toBlockerLines(reasons).map((line) => (
        <li key={line.key}>
          {line.requirementId ? (
            <a
              href={`#${requirementAnchorId(line.requirementId)}`}
              className="rounded-sm text-foreground underline decoration-border underline-offset-2 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {line.text}
            </a>
          ) : (
            line.text
          )}
        </li>
      ))}
    </ul>
  )
}
