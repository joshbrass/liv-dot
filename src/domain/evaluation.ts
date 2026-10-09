import type { RequirementId } from './requirements'

export type RequirementBlockCode = 'requirement_unmet' | 'requirement_pending'

export type GeneralBlockCode =
  | 'start_time_missing'
  | 'start_time_in_past'
  | 'wrong_status'
  | 'invalid_transition'
  | 'requirements_met'
  | 'requirements_locked'

/** Why an action or transition is blocked. Requirement-related reasons always name the requirement. */
export type BlockReason =
  | { code: RequirementBlockCode; message: string; requirementId: RequirementId }
  | { code: GeneralBlockCode; message: string; requirementId?: never }

/** A blocked evaluation always carries at least one reason. */
export type Evaluation =
  { allowed: true; reasons: [] } | { allowed: false; reasons: [BlockReason, ...BlockReason[]] }

export function toEvaluation(reasons: readonly BlockReason[]): Evaluation {
  const [first, ...rest] = reasons
  return first ? { allowed: false, reasons: [first, ...rest] } : { allowed: true, reasons: [] }
}
