import type { RequirementId } from '@/domain'

/** DOM id of a requirement's checklist row, so blocked reasons can link straight to it. */
export function requirementAnchorId(id: RequirementId): string {
  return `requirement-${id}`
}
