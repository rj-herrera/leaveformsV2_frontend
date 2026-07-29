import type { DistributionType } from '../components/admin/SelectDistributionModal'

const BASE = '/admin/leave-balances/distributions'

export function leaveBalancesLandingPath(): string {
  return '/admin/leave-balances'
}

/** Entry path for a distribution type. Contractual starts on Assign (no separate select page). */
export function distributionEmployeesPath(type: DistributionType): string {
  if (type === 'contractual') return `${BASE}/contractual/assign`
  return `${BASE}/${type}/employees`
}

export function distributionAssignPath(
  type: Extract<DistributionType, 'contractual'>,
): string {
  return `${BASE}/${type}/assign`
}

export function distributionReviewPath(type: DistributionType): string {
  return `${BASE}/${type}/review`
}
