import useSWR from 'swr'
import {
  getEmployeesWithLwop,
  type ListEmployeesWithLwopParams,
} from '../../api/adminEmployeesWithLwop'
import { swrKeys } from './swrKeys'

/**
 * Page → hook → `api/adminEmployeesWithLwop` for
 * GET /admin/reports/employees-with-lwop.
 * Pass `null` to skip until Generate Report.
 * Snapshot only — do not refetch on tab focus; Generate Report is the refresh.
 */
export function useAdminEmployeesWithLwop(
  params: ListEmployeesWithLwopParams | null,
) {
  return useSWR(
    params == null ? null : swrKeys.adminEmployeesWithLwop(params),
    params == null ? null : () => getEmployeesWithLwop(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  )
}
