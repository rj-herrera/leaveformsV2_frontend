import { apiGetList, apiPostData } from './axios-client'
import type { LeaveDetail, RejectLeavePayload } from './types'

/** GET /approvals/pending — leaves this approver can act on. */
export async function listPendingApprovals(): Promise<LeaveDetail[]> {
  const { data } = await apiGetList<LeaveDetail>('/approvals/pending')
  return data
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
