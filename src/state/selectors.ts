import {
  evaluateRequirementChange,
  getAvailableActions,
  getReadinessSummary,
  listRequirements,
  type AvailableAction,
  type Evaluation,
  type EventSnapshot,
  type ReadinessSummary,
  type Requirement,
} from '@/domain'
import type { DashboardState, LoadedDashboard, TransitionCommand } from './types'

/*
 * Everything the UI shows about readiness and actions is derived here from the
 * source-of-truth event and requirements; none of it is stored in state.
 */

export function selectLoadedDashboard(state: DashboardState): LoadedDashboard | null {
  return state.data.status === 'loaded' ? state.data : null
}

export function selectSnapshot({ event, requirements }: LoadedDashboard): EventSnapshot {
  return { event, requirements }
}

export function selectAvailableActions(
  data: LoadedDashboard,
  now: Date = new Date(),
): AvailableAction[] {
  return getAvailableActions(selectSnapshot(data), now)
}

export function selectReadinessSummary(data: LoadedDashboard): ReadinessSummary {
  return getReadinessSummary(data.requirements)
}

export function selectRequirementList(data: LoadedDashboard): Requirement[] {
  return listRequirements(data.requirements)
}

export function selectRequirementLock(data: LoadedDashboard): Evaluation {
  return evaluateRequirementChange(selectSnapshot(data))
}

export function selectPendingCommand({ transition }: LoadedDashboard): TransitionCommand | null {
  return transition.status === 'pending' ? transition.command : null
}

export function selectIsRequirementPending(data: LoadedDashboard): boolean {
  return selectRequirementList(data).some(({ request }) => request.status === 'pending')
}
