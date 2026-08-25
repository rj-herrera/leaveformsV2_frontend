import useSWR from 'swr'
import {
  listAdminBalances,
  type ListAdminBalancesParams,
} from '../../api/adminBalances'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/adminBalances` for GET /admin/balances. */
export function useAdminBalances(params: ListAdminBalancesParams) {
  return useSWR(swrKeys.adminBalances(params), () => listAdminBalances(params), {
    keepPreviousData: true,
  })
}
