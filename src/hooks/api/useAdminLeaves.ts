import useSWR from 'swr'
import {
  listAdminLeaves,
  type ListAdminLeavesParams,
} from '../../api/adminLeaves'
import { swrKeys } from './swrKeys'

/**
 * Page → hook → `api/adminLeaves` for GET /admin/leaves.
 * Pass `null` to skip fetching (e.g. while on the Pending tab).
 */
export function useAdminLeaves(params: ListAdminLeavesParams | null) {
  return useSWR(
    params == null ? null : swrKeys.adminLeaves(params),
    params == null ? null : () => listAdminLeaves(params),
    { keepPreviousData: true },
  )
}
