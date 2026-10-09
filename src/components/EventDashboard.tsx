import { assertNever } from '@/lib/assertNever'
import {
  selectLoadedDashboard,
  selectReadinessSummary,
  selectRequirementList,
  selectRequirementLock,
} from '@/state/selectors'
import { useEventDashboard } from '@/state/useEventDashboard'
import { ActionPanel } from './actions/ActionPanel'
import { ActivityFeed } from './activity/ActivityFeed'
import { EventHeader } from './event/EventHeader'
import { LifecycleStepper } from './event/LifecycleStepper'
import { ErrorState } from './feedback/ErrorState'
import { LoadingSkeleton } from './feedback/LoadingSkeleton'
import { DashboardLayout } from './layout/DashboardLayout'
import { ReadinessChecklist } from './readiness/ReadinessChecklist'
import { DemoDrawer } from './simulation/DemoDrawer'

/** The only component that talks to the store; everything below it receives plain props. */
export function EventDashboard() {
  const {
    state,
    reload,
    setRequirement,
    runAction,
    retry,
    dismissNotice,
    resetScenario,
    setFailNextRequest,
    simulateStreamFailure,
  } = useEventDashboard()
  const data = selectLoadedDashboard(state)

  const renderBody = () => {
    switch (state.data.status) {
      case 'loading':
        return <LoadingSkeleton />
      case 'error':
        return (
          <ErrorState
            title="We couldn’t load this event"
            message={state.data.message}
            onRetry={() => void reload()}
          />
        )
      case 'loaded':
        return (
          <>
            <section className="space-y-4 rounded-lg border bg-card p-4">
              <EventHeader event={state.data.event} />
              <div className="border-t pt-4">
                <LifecycleStepper status={state.data.event.status} />
              </div>
            </section>

            {/* Source order is the mobile order: checklist, then Go live, then activity. */}
            <div className="grid items-start gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ReadinessChecklist
                  requirements={selectRequirementList(state.data)}
                  summary={selectReadinessSummary(state.data)}
                  lock={selectRequirementLock(state.data)}
                  onChange={(id, satisfied) => void setRequirement(id, satisfied)}
                />
              </div>
              <div className="space-y-4">
                <ActionPanel data={state.data} onRun={(command) => void runAction(command)} />
                <ActivityFeed
                  notices={state.notices}
                  onDismiss={dismissNotice}
                  onRetry={(intent) => void retry(intent)}
                />
              </div>
            </div>
          </>
        )
      default:
        return assertNever(state.data)
    }
  }

  return (
    <DashboardLayout
      eventTitle={data?.event.title ?? null}
      status={data?.event.status ?? null}
      overlay={
        <DemoDrawer
          data={data}
          failNextRequest={state.failNextRequest}
          onResetScenario={(id) => void resetScenario(id)}
          onSetRequirement={(id, satisfied) => void setRequirement(id, satisfied)}
          onFailNextChange={setFailNextRequest}
          onSimulateStreamFailure={() => void simulateStreamFailure()}
          onReload={() => void reload()}
        />
      }
    >
      {renderBody()}
    </DashboardLayout>
  )
}
