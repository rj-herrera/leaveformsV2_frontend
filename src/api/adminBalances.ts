import { apiGetList, apiPostData, type Paginated } from './axios-client'
import type {
  AdminEmployeeBalanceRow,
  EmploymentStatusApi,
} from './types'

export type ListAdminBalancesParams = {
  q?: string
  department_id?: number
  group_id?: number
  employment_status?: EmploymentStatusApi
  sort?: 'asc' | 'desc'
  per_page?: number
  page?: number
}

export type AdjustAdminBalancePayload = {
  emp_id: number
  code: string
  available_delta: string
  remarks: string
}

/** GET /admin/balances — org-wide employee balances (paginated). */
export async function listAdminBalances(
  params?: ListAdminBalancesParams,
): Promise<Paginated<AdminEmployeeBalanceRow>> {
  return apiGetList<AdminEmployeeBalanceRow>('/admin/balances', { params })
}

/** POST /admin/balances — manual available-credit adjustment. */
export async function adjustAdminBalance(
  payload: AdjustAdminBalancePayload,
): Promise<AdminEmployeeBalanceRow> {
  return apiPostData<AdminEmployeeBalanceRow>('/admin/balances', payload)
}
