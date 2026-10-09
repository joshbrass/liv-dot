import { createContext } from 'react'
import type { RequirementId } from '@/domain'
import type { ScenarioId } from '@/services/scenarios'
import type { DashboardState, RetryIntent, TransitionCommand } from './types'

export interface EventDashboardContextValue {
  state: DashboardState
  reload(): Promise<void>
  setRequirement(id: RequirementId, satisfied: boolean): Promise<void>
  runAction(command: TransitionCommand): Promise<void>
  retry(intent: RetryIntent): Promise<void>
  dismissNotice(id: number): void
  /** Demo controls */
  resetScenario(id: ScenarioId): Promise<void>
  setFailNextRequest(armed: boolean): void
  simulateStreamFailure(): Promise<void>
}

export const EventDashboardContext = createContext<EventDashboardContextValue | null>(null)
