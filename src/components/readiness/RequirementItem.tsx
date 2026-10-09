import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { REQUIREMENT_DEFINITIONS, type Requirement, type RequirementId } from '@/domain'
import { cn } from '@/lib/utils'
import { RequirementIcon } from './RequirementIcon'
import { requirementAnchorId } from './requirementAnchor'
import { requirementDisplayState } from './requirementDisplayState'

const CONFIGURE_LABELS: Record<RequirementId, string> = {
  crew: 'Assign crew',
  ingest: 'Configure ingest',
  pricing: 'Set pricing',
}

interface RequirementItemProps {
  requirement: Requirement
  locked: boolean
  onChange: (id: RequirementId, satisfied: boolean) => void
}

export function RequirementItem({ requirement, locked, onChange }: RequirementItemProps) {
  const state = requirementDisplayState(requirement)
  const { name } = REQUIREMENT_DEFINITIONS[requirement.id]
  const toggle = () => onChange(requirement.id, !requirement.satisfied)

  let trailing: ReactNode = null
  if (state === 'met') trailing = <Muted>Done</Muted>
  if (state === 'pending') trailing = <Muted>Saving…</Muted>
  if (state === 'missing') {
    trailing = locked ? (
      <Muted>Missing</Muted>
    ) : (
      <RowButton onClick={toggle} label={CONFIGURE_LABELS[requirement.id]} name={name} />
    )
  }
  if (state === 'error' && !locked) {
    trailing = <RowButton onClick={toggle} label="Retry" name={name} />
  }

  return (
    <li
      id={requirementAnchorId(requirement.id)}
      tabIndex={-1}
      className="flex min-h-11 items-center gap-3 px-4 py-2 outline-none focus:bg-muted"
    >
      <RequirementIcon state={state} />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5 font-medium">
          {name}
          {state === 'missing' && !locked && <span className="sr-only"> (Missing)</span>}
        </p>
        <p
          className={cn(
            'text-[13px] leading-5 sm:truncate',
            state === 'error' ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {requirement.request.status === 'error'
            ? `Update failed: ${requirement.request.message}`
            : requirement.description}
        </p>
      </div>
      <div className="shrink-0">{trailing}</div>
    </li>
  )
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="text-[13px] text-muted-foreground">{children}</span>
}

function RowButton({ onClick, label, name }: { onClick: () => void; label: string; name: string }) {
  return (
    <Button variant="outline" size="sm" className="h-7 text-[13px]" onClick={onClick}>
      {label}
      <span className="sr-only"> for {name.toLowerCase()}</span>
    </Button>
  )
}
