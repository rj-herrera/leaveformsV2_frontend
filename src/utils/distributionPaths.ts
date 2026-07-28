import type { DistributionType } from '../components/admin/SelectDistributionModal'

const BASE = '/admin/leave-balances/distributions'

export function distributionEmployeesPath(type: DistributionType): string {
  return `${BASE}/${type}/employees`
}

export function distributionReviewPath(type: DistributionType): string {
  return `${BASE}/${type}/review`
}
