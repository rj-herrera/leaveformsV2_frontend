import {
  listMyLeaves,
  type ListMyLeavesParams,
} from '../../api/leaves'
import type { LeaveResource } from '../../api/types'
import type { Paginated } from '../../api/axios-client'
import { useAsyncResource, type AsyncResourceState } from './useAsyncResource'

/** Page → hook → `api/leaves` for GET /leaves. */
export function useMyLeaves(
  params?: ListMyLeavesParams,
): AsyncResourceState<Paginated<LeaveResource>> {
  return useAsyncResource(
    () => listMyLeaves(params),
    [params?.status, params?.per_page],
  )
}
