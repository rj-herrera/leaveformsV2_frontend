import {
  apiGetData,
  apiGetList,
  apiPostData,
  apiPostFormData,
  apiPutData,
  type Paginated,
} from './axios-client'
import type {
  CancelLeavePayload,
  DayType,
  LeaveDetail,
  LeaveStatus,
  LeaveSummary,
  StoreLeavePayload,
  UpdateLeavePayload,
} from './types'

function appendLeaveFields(
  form: FormData,
  fields: {
    emp_id?: number
    code?: string
    start_date: string
    end_date: string
    day_type: DayType
    leave_reason: string
    leave_attachment?: File
  },
) {
  if (fields.emp_id != null) form.append('emp_id', String(fields.emp_id))
  if (fields.code) form.append('code', fields.code)
  form.append('start_date', fields.start_date)
  form.append('end_date', fields.end_date)
  form.append('day_type', fields.day_type)
  form.append('leave_reason', fields.leave_reason)
  if (fields.leave_attachment) {
    form.append('leave_attachment', fields.leave_attachment)
  }
}

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

/** POST /leaves — VL as JSON, SL as multipart with required med cert (201). */
export async function createLeave(
  payload: StoreLeavePayload,
): Promise<LeaveDetail> {
  const code = (payload.code ?? 'VL').toUpperCase()
  if (code === 'SL' || payload.leave_attachment) {
    const form = new FormData()
    appendLeaveFields(form, { ...payload, code })
    return apiPostFormData<LeaveDetail>('/leaves', form)
  }

  return apiPostData<LeaveDetail>('/leaves', {
    emp_id: payload.emp_id,
    code: 'VL',
    start_date: payload.start_date,
    end_date: payload.end_date,
    day_type: payload.day_type,
    leave_reason: payload.leave_reason,
  })
}

/** PUT JSON, or POST multipart when replacing the SL med cert. */
export async function updateLeave(
  leaveId: number,
  payload: UpdateLeavePayload,
): Promise<LeaveDetail> {
  if (payload.leave_attachment) {
    const form = new FormData()
    appendLeaveFields(form, payload)
    return apiPostFormData<LeaveDetail>(`/leaves/${leaveId}`, form)
  }

  return apiPutData<LeaveDetail>(`/leaves/${leaveId}`, {
    start_date: payload.start_date,
    end_date: payload.end_date,
    day_type: payload.day_type,
    leave_reason: payload.leave_reason,
  })
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
