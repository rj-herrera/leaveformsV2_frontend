import { apiGetList, axiosClient, type Paginated } from './axios-client'
import type {
  AdminAnnualEntitlementMeta,
  AdminAnnualEntitlementRow,
} from './types/annualEntitlement'

export type ListAdminAnnualEntitlementsParams = {
  year?: number
  q?: string
  group_id?: number
  /** Comma-separated or array — sent as `emp_ids=8,12`. */
  emp_ids?: number[] | string
  sort?: 'asc' | 'desc'
  per_page?: number
  page?: number
}

export type DistributeAnnualEntitlementsPayload = {
  year: number
  emp_ids: number[]
}

export type AdminAnnualEntitlementsPage = Paginated<AdminAnnualEntitlementRow> & {
  meta?: AdminAnnualEntitlementMeta
}

function serializeParams(
  params?: ListAdminAnnualEntitlementsParams,
): Record<string, string | number> | undefined {
  if (!params) return undefined
  const out: Record<string, string | number> = {}
  if (params.year != null) out.year = params.year
  if (params.q) out.q = params.q
  if (params.group_id != null) out.group_id = params.group_id
  if (params.sort) out.sort = params.sort
  if (params.per_page != null) out.per_page = params.per_page
  if (params.page != null) out.page = params.page
  if (params.emp_ids != null) {
    out.emp_ids = Array.isArray(params.emp_ids)
      ? params.emp_ids.join(',')
      : params.emp_ids
  }
  return out
}

/** GET /admin/annual-entitlements — candidates (or review refetch via emp_ids). */
export async function listAdminAnnualEntitlements(
  params?: ListAdminAnnualEntitlementsParams,
): Promise<AdminAnnualEntitlementsPage> {
  return apiGetList<AdminAnnualEntitlementRow>('/admin/annual-entitlements', {
    params: serializeParams(params),
  }) as Promise<AdminAnnualEntitlementsPage>
}

/** POST /admin/annual-entitlements — confirm distribution for checked employees. */
export async function distributeAnnualEntitlements(
  payload: DistributeAnnualEntitlementsPayload,
): Promise<AdminAnnualEntitlementRow[]> {
  const { data } = await axiosClient.post<{ data: AdminAnnualEntitlementRow[] }>(
    '/admin/annual-entitlements',
    payload,
  )
  if (!data || !Array.isArray(data.data)) {
    return []
  }
  return data.data
}
