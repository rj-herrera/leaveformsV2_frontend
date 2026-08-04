import {
  apiGetData,
  apiGetList,
  apiPostData,
  apiPutData,
  type Paginated,
} from './axios-client'
import type {
  CancelLeavePayload,
  LeaveDetail,
  LeaveStatus,
  LeaveSummary,
  StoreLeavePayload,
  UpdateLeavePayload,
} from './types'

export type ListMyLeavesParams = {
  status?: LeaveStatus
  per_page?: number
  page?: number
}

/** GET /leaves — slim paginated rows for the employee list. */
export async function listMyLeaves(
  params?: ListMyLeavesParams,
): Promise<Paginated<LeaveSummary>> {
  return apiGetList<LeaveSummary>('/leaves', { params })
}

/** GET /leaves/{id} — full detail (approvals + conversion). */
export async function getLeave(leaveId: number): Promise<LeaveDetail> {
  return apiGetData<LeaveDetail>(`/leaves/${leaveId}`)
}

/** POST /leaves — file a VL request (201); returns detail. */
export async function createLeave(
  payload: StoreLeavePayload,
): Promise<LeaveDetail> {
  return apiPostData<LeaveDetail>('/leaves', payload)
}

/** PUT /leaves/{id} — edit a pending VL request; returns detail. */
export async function updateLeave(
  leaveId: number,
  payload: UpdateLeavePayload,
): Promise<LeaveDetail> {
  return apiPutData<LeaveDetail>(`/leaves/${leaveId}`, payload)
}

/** POST /leaves/{id}/cancel — cancel an open request; returns detail. */
export async function cancelLeave(
  leaveId: number,
  payload: CancelLeavePayload,
): Promise<LeaveDetail> {
  return apiPostData<LeaveDetail>(`/leaves/${leaveId}/cancel`, payload)
}

/** Relative path for GET /leaves/{id}/attachment (cookie auth via same origin). */
export function leaveAttachmentPath(leaveId: number): string {
  return `/api/leaves/${leaveId}/attachment`
}
