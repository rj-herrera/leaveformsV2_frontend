import useSWR from 'swr'
import { listBalances } from '../../api/balances'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/balances` for GET /balances. */
export function useMyBalances(params?: { code?: string }) {
  return useSWR(swrKeys.balances(params?.code), () => listBalances(params))
}
