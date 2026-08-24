import { apiGetList, type Paginated } from './axios-client'
import type { ApprovalInboxRow, LeaveOrgRef, LeaveStatus } from './types'

/** Statuses allowed on GET /admin/leaves `?status=`. */
export type AdminLeavesListStatus = Extract<
  LeaveStatus,
  | 'pending_approval'
  | 'pending_conversion'
  | 'confirmed'
  | 'converted_to_sl'
>

export type ListAdminLeavesParams = {
  status?: AdminLeavesListStatus
  code?: string
  group_id?: number
  sort?: 'asc' | 'desc'
  per_page?: number
  page?: number
}

/** GET /admin/leaves — org-wide admin list (paginated slim rows). */
export async function listAdminLeaves(
  params?: ListAdminLeavesParams,
): Promise<Paginated<ApprovalInboxRow>> {
  return apiGetList<ApprovalInboxRow>('/admin/leaves', { params })
}

/** GET /admin/groups — org-wide group_list for the All Leave Requests filter. */
export async function listAdminGroups(): Promise<LeaveOrgRef[]> {
  const { data } = await apiGetList<LeaveOrgRef>('/admin/groups')
  return data
}
