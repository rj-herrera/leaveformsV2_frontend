import useSWR from 'swr'
import {
  listApprovals,
  type ListApprovalsParams,
} from '../../api/approvals'
import { swrKeys } from './swrKeys'

/**
 * Page → hook → `api/approvals` for GET /approvals.
 * Pass `null` to skip fetching (e.g. while on the Pending tab).
 */
export function useApprovals(params: ListApprovalsParams | null) {
  return useSWR(
    params == null ? null : swrKeys.approvals(params),
    params == null ? null : () => listApprovals(params),
    { keepPreviousData: true },
  )
}
