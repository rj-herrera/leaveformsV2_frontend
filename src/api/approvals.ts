import { apiGetList, apiPostData } from './axios-client'
import type { LeaveResource, RejectLeavePayload } from './types'

/** GET /approvals/pending — leaves this approver can act on. */
export async function listPendingApprovals(): Promise<LeaveResource[]> {
  const { data } = await apiGetList<LeaveResource>('/approvals/pending')
  return data
}

/** POST /leaves/{id}/approve */
export async function approveLeave(leaveId: number): Promise<LeaveResource> {
  return apiPostData<LeaveResource>(`/leaves/${leaveId}/approve`)
}

/** POST /leaves/{id}/reject — remarks required. */
export async function rejectLeave(
  leaveId: number,
  payload: RejectLeavePayload,
): Promise<LeaveResource> {
  return apiPostData<LeaveResource>(`/leaves/${leaveId}/reject`, payload)
}
