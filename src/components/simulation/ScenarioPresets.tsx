import { SCENARIOS, SCENARIO_IDS, type ScenarioId } from '@/services/scenarios'
import { cn } from '@/lib/utils'

interface ScenarioPresetsProps {
  active: ScenarioId
  onSelect: (id: ScenarioId) => void
}

export function ScenarioPresets({ active, onSelect }: ScenarioPresetsProps) {
  return (
    <ul className="space-y-0.5">
      {SCENARIO_IDS.map((id) => {
        const isActive = active === id
        return (
          <li key={id}>
            <button
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelect(id)}
              className={cn(
                'w-full rounded-md px-2 py-1.5 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                isActive && 'bg-muted',
              )}
            >
              <span className={cn('block text-[13px]', isActive && 'font-medium')}>
                {SCENARIOS[id].label}
              </span>
              <span
                className={cn(
                  'block text-xs',
                  isActive ? 'text-gray-600' : 'text-muted-foreground',
                )}
              >
                {SCENARIOS[id].description}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
