import { apiGetList, apiPostData, type Paginated } from './axios-client'
import type {
  ApprovalInboxRow,
  CancelLeavePayload,
  LeaveDetail,
  LeaveOrgRef,
  LeaveStatus,
} from './types'

/** Statuses allowed on GET /admin/leaves `?status=`. */
export type AdminLeavesListStatus = Extract<
  LeaveStatus,
  | 'pending_approval'
  | 'pending_conversion'
  | 'confirmed'
  | 'converted_to_sl'
  | 'converted_to_el'
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

/** GET /admin/groups — org-wide group_list for admin filters (`dept_id` for cascade). */
export async function listAdminGroups(): Promise<LeaveOrgRef[]> {
  const { data } = await apiGetList<LeaveOrgRef>('/admin/groups')
  return data
}

/** GET /admin/departments — org-wide department_list for admin filters. */
export async function listAdminDepartments(): Promise<LeaveOrgRef[]> {
  const { data } = await apiGetList<LeaveOrgRef>('/admin/departments')
  return data
}

/** POST /admin/leaves/{id}/cancel — cancel confirmed leave; returns detail. */
export async function cancelAdminLeave(
  leaveId: number,
  payload: CancelLeavePayload,
): Promise<LeaveDetail> {
  return apiPostData<LeaveDetail>(`/admin/leaves/${leaveId}/cancel`, payload)
}
