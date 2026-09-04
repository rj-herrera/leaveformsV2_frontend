import useSWR from 'swr'
import { getLeaveMonetizationCandidates } from '../../api/adminMonetizationCandidates'
import { swrKeys } from './swrKeys'

/**
 * Page → hook → `api/adminMonetizationCandidates` for
 * GET /admin/reports/leave-monetization-candidates.
 * Pass `null` to skip until Generate Report.
 * Snapshot only — do not refetch on tab focus; Generate Report is the refresh.
 */
export function useAdminLeaveMonetizationCandidates(year: number | null) {
  return useSWR(
    year == null ? null : swrKeys.adminLeaveMonetizationCandidates(year),
    year == null ? null : () => getLeaveMonetizationCandidates({ year }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  )
}
