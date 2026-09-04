import { apiGetData } from './axios-client'
import type { LeaveMonetizationCandidatesReport } from './types'

export type ListLeaveMonetizationCandidatesParams = {
  year: number
}

/** GET /admin/reports/leave-monetization-candidates — excess VL/SL (admin only). */
export async function getLeaveMonetizationCandidates(
  params: ListLeaveMonetizationCandidatesParams,
): Promise<LeaveMonetizationCandidatesReport> {
  return apiGetData<LeaveMonetizationCandidatesReport>(
    '/admin/reports/leave-monetization-candidates',
    { params: { year: params.year } },
  )
}
