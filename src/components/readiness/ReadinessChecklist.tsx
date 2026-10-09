import type { Evaluation, ReadinessSummary, Requirement, RequirementId } from '@/domain'
import { RequirementItem } from './RequirementItem'

interface ReadinessChecklistProps {
  requirements: Requirement[]
  summary: ReadinessSummary
  lock: Evaluation
  onChange: (id: RequirementId, satisfied: boolean) => void
}

export function ReadinessChecklist({
  requirements,
  summary,
  lock,
  onChange,
}: ReadinessChecklistProps) {
  return (
    <section aria-labelledby="readiness-title" className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 id="readiness-title" className="text-sm font-semibold">
            Readiness checklist
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Everything here must be done before you can go live.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p id="readiness-summary" className="text-[13px] text-muted-foreground">
            {summary.met} of {summary.total} requirements met
          </p>
          <div
            role="progressbar"
            aria-labelledby="readiness-summary"
            aria-valuemin={0}
            aria-valuemax={summary.total}
            aria-valuenow={summary.met}
            className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-success transition-[width]"
              style={{ width: `${(summary.met / summary.total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {!lock.allowed && (
        <p className="border-b bg-muted px-4 py-2 text-[13px] text-gray-600">
          {lock.reasons[0].message}
        </p>
      )}

      <ul className="divide-y">
        {requirements.map((requirement) => (
          <RequirementItem
            key={requirement.id}
            requirement={requirement}
            locked={!lock.allowed}
            onChange={onChange}
          />
        ))}
      </ul>
    </section>
  )
}
