import { Check, LoaderCircle } from 'lucide-react'
import type { RequirementDisplayState } from './requirementDisplayState'

/** Shape differs per state (tick, empty ring, spinner, "!"), so color is never the only cue. */
export function RequirementIcon({ state }: { state: RequirementDisplayState }) {
  switch (state) {
    case 'met':
      return (
        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-success text-white">
          <Check aria-hidden className="size-2.5" strokeWidth={3.5} />
        </span>
      )
    case 'missing':
      return <span className="size-4 shrink-0 rounded-full border-[1.5px] border-gray-300" />
    case 'pending':
      return (
        <LoaderCircle aria-hidden className="size-4 shrink-0 animate-spin text-muted-foreground" />
      )
    case 'error':
      return (
        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
          !
        </span>
      )
  }
}
