import { listBalances } from '../../api/balances'
import type { LeaveBalanceResource } from '../../api/types'
import { useAsyncResource, type AsyncResourceState } from './useAsyncResource'

/** Page → hook → `api/balances` for GET /balances. */
export function useMyBalances(params?: {
  code?: string
}): AsyncResourceState<LeaveBalanceResource[]> {
  return useAsyncResource(
    () => listBalances(params),
    [params?.code],
  )
}
