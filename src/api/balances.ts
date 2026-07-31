import { apiGetList } from './axios-client'
import type { LeaveBalanceResource } from './types'

/** GET /balances — optional `?code=VL` (case-insensitive). */
export async function listBalances(params?: {
  code?: string
}): Promise<LeaveBalanceResource[]> {
  const { data } = await apiGetList<LeaveBalanceResource>('/balances', {
    params,
  })
  return data
}
