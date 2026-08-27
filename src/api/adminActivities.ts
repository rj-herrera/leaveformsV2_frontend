import { apiGetList, type Paginated } from './axios-client'
import type { AdminLeaveActivityResource } from './types'

export type ListAdminActivitiesParams = {
  q?: string
  group_id?: number
  /** Leave type code filter, e.g. `VL`. */
  code?: string
  /** Calendar month `YYYY-MM` (Asia/Manila). */
  month?: string
  /** Timestamp order — default API `desc` (newest first). */
  sort?: 'asc' | 'desc'
  per_page?: number
  page?: number
}

function serializeParams(
  params?: ListAdminActivitiesParams,
): Record<string, string | number> | undefined {
  if (!params) return undefined
  const out: Record<string, string | number> = {}
  if (params.q) out.q = params.q
  if (params.group_id != null) out.group_id = params.group_id
  if (params.code) out.code = params.code
  if (params.month) out.month = params.month
  if (params.sort) out.sort = params.sort
  if (params.per_page != null) out.per_page = params.per_page
  if (params.page != null) out.page = params.page
  return out
}

/** GET /admin/activities — org-wide Administrative Log (admin only). */
export async function listAdminActivities(
  params?: ListAdminActivitiesParams,
): Promise<Paginated<AdminLeaveActivityResource>> {
  return apiGetList<AdminLeaveActivityResource>('/admin/activities', {
    params: serializeParams(params),
  })
}
