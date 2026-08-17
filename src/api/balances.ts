import { apiGetList } from './axios-client'
import type { LeaveBalanceResource } from './types'

/** GET /balances — optional `?emp_id=` (on-behalf) and `?code=VL`. */
export async function listBalances(params?: {
  emp_id?: number
  code?: string
}): Promise<LeaveBalanceResource[]> {
  const { data } = await apiGetList<LeaveBalanceResource>('/balances', {
    params,
  })
  return data
}
