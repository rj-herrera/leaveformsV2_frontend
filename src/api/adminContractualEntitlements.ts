import { apiGetList, axiosClient, type Paginated } from './axios-client'
import type {
  AdminContractualEntitlementMeta,
  AdminContractualEntitlementRow,
} from './types/contractualEntitlement'

export type ListAdminContractualEntitlementsParams = {
  q?: string
  group_id?: number
  /** Comma-separated or array — sent as `emp_ids=830,831`. */
  emp_ids?: number[] | string
  sort?: 'asc' | 'desc'
  per_page?: number
  page?: number
}

export type ContractualEntitlementEmployeePayload = {
  emp_id: number
  vl_to_add?: string
  sl_to_add?: string
}

export type DistributeContractualEntitlementsPayload = {
  employees: ContractualEntitlementEmployeePayload[]
}

export type AdminContractualEntitlementsPage =
  Paginated<AdminContractualEntitlementRow> & {
    meta?: AdminContractualEntitlementMeta
  }

function serializeParams(
  params?: ListAdminContractualEntitlementsParams,
): Record<string, string | number> | undefined {
  if (!params) return undefined
  const out: Record<string, string | number> = {}
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

/** GET /admin/contractual-entitlements — candidates (or review refetch via emp_ids). */
export async function listAdminContractualEntitlements(
  params?: ListAdminContractualEntitlementsParams,
): Promise<AdminContractualEntitlementsPage> {
  return apiGetList<AdminContractualEntitlementRow>(
    '/admin/contractual-entitlements',
    {
      params: serializeParams(params),
    },
  ) as Promise<AdminContractualEntitlementsPage>
}

/** POST /admin/contractual-entitlements — confirm typed VL/SL grants. */
export async function distributeContractualEntitlements(
  payload: DistributeContractualEntitlementsPayload,
): Promise<AdminContractualEntitlementRow[]> {
  const { data } = await axiosClient.post<{
    data: AdminContractualEntitlementRow[]
  }>('/admin/contractual-entitlements', payload)
  if (!data || !Array.isArray(data.data)) {
    return []
  }
  return data.data
}
