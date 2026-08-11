import useSWR from 'swr'
import { listPendingApprovals } from '../../api/approvals'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/approvals` for GET /approvals/pending. */
export function usePendingApprovals() {
  return useSWR(swrKeys.pendingApprovals, listPendingApprovals)
}
