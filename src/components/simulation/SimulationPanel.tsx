import { Button } from '@/components/ui/button'
import type { RequirementId } from '@/domain'
import type { ScenarioId } from '@/services/scenarios'
import { selectRequirementList, selectRequirementLock } from '@/state/selectors'
import type { LoadedDashboard } from '@/state/types'
import { ControlGroup } from './ControlGroup'
import { DemoToggle } from './DemoToggle'
import { ScenarioPresets } from './ScenarioPresets'

export interface SimulationPanelProps {
  data: LoadedDashboard | null
  activeScenario: ScenarioId
  failNextRequest: boolean
  onResetScenario: (id: ScenarioId) => void
  onSetRequirement: (id: RequirementId, satisfied: boolean) => void
  onFailNextChange: (armed: boolean) => void
  onSimulateStreamFailure: () => void
  onReload: () => void
}

export function SimulationPanel({
  data,
  activeScenario,
  failNextRequest,
  onResetScenario,
  onSetRequirement,
  onFailNextChange,
  onSimulateStreamFailure,
  onReload,
}: SimulationPanelProps) {
  const lock = data ? selectRequirementLock(data) : null
  const isLive = data?.event.status === 'live'

  return (
    <div className="space-y-6 p-4">
      <ControlGroup title="Scenario">
        <ScenarioPresets active={activeScenario} onSelect={onResetScenario} />
      </ControlGroup>

      <ControlGroup title="Requirements">
        {data ? (
          selectRequirementList(data).map((requirement) => (
            <DemoToggle
              key={requirement.id}
              label={requirement.label}
              checked={requirement.satisfied}
              disabled={!lock?.allowed || requirement.request.status === 'pending'}
              onChange={(checked) => onSetRequirement(requirement.id, checked)}
            />
          ))
        ) : (
          <p className="text-[13px] text-muted-foreground">Available once the event has loaded.</p>
        )}
        {lock && !lock.allowed && (
          <p className="text-xs text-muted-foreground">{lock.reasons[0].message}</p>
        )}
      </ControlGroup>

      <ControlGroup title="Failures">
        <DemoToggle
          label="Fail the next request"
          description="The next API call returns an error."
          checked={failNextRequest}
          onChange={onFailNextChange}
        />
        <div className="space-y-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!isLive}
            aria-describedby="stream-failure-hint"
            onClick={onSimulateStreamFailure}
          >
            Simulate stream failure
          </Button>
          <p id="stream-failure-hint" className="text-xs text-muted-foreground">
            {isLive ? 'Drops the broadcast mid-show.' : 'Only available while the event is live.'}
          </p>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={onReload}>
          Reload event
        </Button>
      </ControlGroup>
    </div>
  )
}
