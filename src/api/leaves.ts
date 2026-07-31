import {
  apiGetList,
  apiPostData,
  apiPutData,
  type Paginated,
} from './axios-client'
import type {
  CancelLeavePayload,
  LeaveResource,
  LeaveStatus,
  StoreLeavePayload,
  UpdateLeavePayload,
} from './types'

export type ListMyLeavesParams = {
  status?: LeaveStatus
  per_page?: number
}

/** GET /leaves — current employee's leave requests (paginated). */
export async function listMyLeaves(
  params?: ListMyLeavesParams,
): Promise<Paginated<LeaveResource>> {
  return apiGetList<LeaveResource>('/leaves', { params })
}

/** POST /leaves — file a VL request (201). */
export async function createLeave(
  payload: StoreLeavePayload,
): Promise<LeaveResource> {
  return apiPostData<LeaveResource>('/leaves', payload)
}

/** PUT /leaves/{id} — edit a pending VL request. */
export async function updateLeave(
  leaveId: number,
  payload: UpdateLeavePayload,
): Promise<LeaveResource> {
  return apiPutData<LeaveResource>(`/leaves/${leaveId}`, payload)
}

/** POST /leaves/{id}/cancel — cancel an open request. */
export async function cancelLeave(
  leaveId: number,
  payload: CancelLeavePayload,
): Promise<LeaveResource> {
  return apiPostData<LeaveResource>(`/leaves/${leaveId}/cancel`, payload)
}

/** Relative path for GET /leaves/{id}/attachment (cookie auth via same origin). */
export function leaveAttachmentPath(leaveId: number): string {
  return `/api/leaves/${leaveId}/attachment`
}
