import type { Requirement } from '@/domain'

export type RequirementDisplayState = 'met' | 'missing' | 'pending' | 'error'

export function requirementDisplayState({
  request,
  satisfied,
}: Requirement): RequirementDisplayState {
  if (request.status === 'pending') return 'pending'
  if (request.status === 'error') return 'error'
  return satisfied ? 'met' : 'missing'
}
