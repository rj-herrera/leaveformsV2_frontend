import { listPendingApprovals } from '../../api/approvals'
import type { LeaveResource } from '../../api/types'
import { useAsyncResource, type AsyncResourceState } from './useAsyncResource'

/** Page → hook → `api/approvals` for GET /approvals/pending. */
export function usePendingApprovals(): AsyncResourceState<LeaveResource[]> {
  return useAsyncResource(() => listPendingApprovals(), [])
}
