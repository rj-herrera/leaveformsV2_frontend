import { apiGetList, axiosClient, type Paginated } from './axios-client'
import type {
  AdminNewlyRegularizedMeta,
  AdminNewlyRegularizedRow,
} from './types/newlyRegularized'

export type ListAdminNewlyRegularizedParams = {
  year?: number
  q?: string
  group_id?: number
  emp_ids?: number[] | string
  sort?: 'asc' | 'desc'
  per_page?: number
  page?: number
}

export type DistributeNewlyRegularizedPayload = {
  year: number
  emp_ids: number[]
}

export type AdminNewlyRegularizedPage = Paginated<AdminNewlyRegularizedRow> & {
  meta?: AdminNewlyRegularizedMeta
}

function serializeParams(
  params?: ListAdminNewlyRegularizedParams,
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

/** GET /admin/newly-regularized — candidates (or review refetch via emp_ids). */
export async function listAdminNewlyRegularized(
  params?: ListAdminNewlyRegularizedParams,
): Promise<AdminNewlyRegularizedPage> {
  return apiGetList<AdminNewlyRegularizedRow>('/admin/newly-regularized', {
    params: serializeParams(params),
  }) as Promise<AdminNewlyRegularizedPage>
}

/** POST /admin/newly-regularized — confirm distribution for checked employees. */
export async function distributeNewlyRegularized(
  payload: DistributeNewlyRegularizedPayload,
): Promise<AdminNewlyRegularizedRow[]> {
  const { data } = await axiosClient.post<{ data: AdminNewlyRegularizedRow[] }>(
    '/admin/newly-regularized',
    payload,
  )
  if (!data || !Array.isArray(data.data)) {
    return []
  }
  return data.data
}
