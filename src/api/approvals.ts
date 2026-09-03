import { apiGetList, apiPostData, type Paginated } from './axios-client'
import type {
  ApprovalInboxRow,
  LeaveDetail,
  LeaveStatus,
  RejectLeavePayload,
} from './types'

/** Statuses allowed on GET /approvals `?status=`. */
export type ApprovalsListStatus = Extract<
  LeaveStatus,
  | 'confirmed'
  | 'rejected'
  | 'pending_conversion'
  | 'converted_to_sl'
  | 'converted_to_el'
>

export type ListApprovalsParams = {
  status?: ApprovalsListStatus
  code?: string
  sort?: 'asc' | 'desc'
  per_page?: number
  page?: number
}

/** GET /approvals/pending — actionable inbox (full collection, slim rows). */
export async function listPendingApprovals(): Promise<ApprovalInboxRow[]> {
  const { data } = await apiGetList<ApprovalInboxRow>('/approvals/pending')
  return data
}

/** GET /approvals — All Leave Requests for PIC groups (paginated slim rows). */
export async function listApprovals(
  params?: ListApprovalsParams,
): Promise<Paginated<ApprovalInboxRow>> {
  return apiGetList<ApprovalInboxRow>('/approvals', { params })
}

/** POST /leaves/{id}/approve */
export async function approveLeave(leaveId: number): Promise<LeaveDetail> {
  return apiPostData<LeaveDetail>(`/leaves/${leaveId}/approve`)
}

/** POST /leaves/{id}/reject — remarks required. */
export async function rejectLeave(
  leaveId: number,
  payload: RejectLeavePayload,
): Promise<LeaveDetail> {
  return apiPostData<LeaveDetail>(`/leaves/${leaveId}/reject`, payload)
}
