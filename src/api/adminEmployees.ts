import { apiGetList } from './axios-client'
import type { AdminEmployeeRef } from './types'

export type ListAdminEmployeesParams = {
  group_id?: number
}

/** GET /admin/employees — slim org-wide picker (admin only, no pagination). */
export async function listAdminEmployees(
  params?: ListAdminEmployeesParams,
): Promise<AdminEmployeeRef[]> {
  const query: Record<string, number> = {}
  if (params?.group_id != null) query.group_id = params.group_id

  const { data } = await apiGetList<AdminEmployeeRef>('/admin/employees', {
    params: Object.keys(query).length > 0 ? query : undefined,
  })
  return data
}
