import {
  apiDeleteData,
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
  LeaveAttachmentFile,
  LeaveDetail,
  LeaveLwopParams,
  LeaveLwopResource,
  LeaveQuarterUsageParams,
  LeaveQuarterUsageResource,
  LeaveStatus,
  LeaveSummary,
  StoreLeavePayload,
  UpdateLeavePayload,
} from './types'
import { ATTACHMENT_MAX_FILES } from '../utils/leaveFiling'

function appendAttachmentFiles(
  form: FormData,
  field: 'leave_attachment',
  files: File[] | undefined,
) {
  if (!files || files.length === 0) return
  for (const file of files) {
    form.append(`${field}[]`, file)
  }
}

function appendLeaveFields(
  form: FormData,
  fields: {
    emp_id?: number
    code?: string
    start_date: string
    end_date: string
    day_type: DayType
    leave_reason: string
    assignment_type?: string
    special_leave_reason?: string
    leave_attachment?: File[]
  },
) {
  if (fields.emp_id != null) form.append('emp_id', String(fields.emp_id))
  if (fields.code) form.append('code', fields.code)
  form.append('start_date', fields.start_date)
  form.append('end_date', fields.end_date)
  form.append('day_type', fields.day_type)
  form.append('leave_reason', fields.leave_reason)
  if (fields.assignment_type) {
    form.append('assignment_type', fields.assignment_type)
  }
  if (fields.special_leave_reason) {
    form.append('special_leave_reason', fields.special_leave_reason)
  }
  appendAttachmentFiles(form, 'leave_attachment', fields.leave_attachment)
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

/**
 * GET /leaves/lwop — accepted VL/SL unpaid days in a calendar year.
 * Omit `year` for the current Asia/Manila year. Same on-behalf rules as
 * GET /balances. Always returns zeros when there is no accepted LWOP.
 */
export async function getLeaveLwop(
  params?: LeaveLwopParams,
): Promise<LeaveLwopResource> {
  return apiGetData<LeaveLwopResource>('/leaves/lwop', {
    params: {
      ...(params?.year != null ? { year: params.year } : {}),
      ...(params?.emp_id != null ? { emp_id: params.emp_id } : {}),
    },
  })
}

/**
 * GET /leaves/quarter-usage — projected VL days in the overlapping quarter(s).
 * Informational only; never blocks filing. Non-VL → `applicable: false`.
 */
export async function getLeaveQuarterUsage(
  params: LeaveQuarterUsageParams,
): Promise<LeaveQuarterUsageResource> {
  return apiGetData<LeaveQuarterUsageResource>('/leaves/quarter-usage', {
    params: {
      start_date: params.start_date,
      end_date: params.end_date,
      day_type: params.day_type ?? 'full',
      ...(params.emp_id != null ? { emp_id: params.emp_id } : {}),
      ...(params.code ? { code: params.code } : {}),
    },
  })
}

/** POST /leaves — VL/ML as JSON; SL/PTB/EL/LL/PL/SPL as multipart with required attachments (201). */
export async function createLeave(
  payload: StoreLeavePayload,
): Promise<LeaveDetail> {
  const code = (payload.code ?? 'VL').toUpperCase()
  const files = payload.leave_attachment ?? []
  if (
    code === 'SL' ||
    code === 'PTB' ||
    code === 'EL' ||
    code === 'LL' ||
    code === 'PL' ||
    code === 'SPL' ||
    files.length > 0
  ) {
    const form = new FormData()
    appendLeaveFields(form, { ...payload, code, leave_attachment: files })
    return apiPostFormData<LeaveDetail>('/leaves', form)
  }

  return apiPostData<LeaveDetail>('/leaves', {
    emp_id: payload.emp_id,
    code,
    start_date: payload.start_date,
    end_date: payload.end_date,
    day_type: payload.day_type,
    leave_reason: payload.leave_reason,
  })
}

/** PUT JSON — dates/reason (SPL also assignment + event). Files use attachment endpoints. */
export async function updateLeave(
  leaveId: number,
  payload: UpdateLeavePayload,
): Promise<LeaveDetail> {
  return apiPutData<LeaveDetail>(`/leaves/${leaveId}`, {
    start_date: payload.start_date,
    end_date: payload.end_date,
    day_type: payload.day_type,
    leave_reason: payload.leave_reason,
    ...(payload.assignment_type
      ? { assignment_type: payload.assignment_type }
      : {}),
    ...(payload.special_leave_reason
      ? { special_leave_reason: payload.special_leave_reason }
      : {}),
  })
}

/** POST /leaves/{id}/attachments — add 1+ files (total after add ≤ 5). */
export async function addLeaveAttachments(
  leaveId: number,
  files: File[],
): Promise<LeaveDetail> {
  const form = new FormData()
  appendAttachmentFiles(form, 'leave_attachment', files)
  return apiPostFormData<LeaveDetail>(`/leaves/${leaveId}/attachments`, form)
}

/** DELETE /leaves/{id}/attachments/{attachmentId} — cannot drop below 1 file. */
export async function deleteLeaveAttachment(
  leaveId: number,
  attachmentId: number,
): Promise<LeaveDetail> {
  return apiDeleteData<LeaveDetail>(
    `/leaves/${leaveId}/attachments/${attachmentId}`,
  )
}

/**
 * Apply queued add/remove attachment edits on a pending SL/PTB/EL/LL/PL/SPL.
 * Deletes first when the server is at the cap so adds do not 422; adds first
 * when a delete would otherwise drop below 1 file.
 */
export async function syncLeaveAttachments(
  leaveId: number,
  current: LeaveAttachmentFile[],
  keepIds: number[],
  addFiles: File[],
): Promise<LeaveDetail | null> {
  const keep = new Set(keepIds)
  const toRemove = current.filter((file) => !keep.has(file.id)).map((file) => file.id)
  const toAdd = [...addFiles]
  if (toRemove.length === 0 && toAdd.length === 0) return null

  let serverIds = current.map((file) => file.id)
  let latest: LeaveDetail | null = null

  while (toRemove.length > 0 || toAdd.length > 0) {
    const count = serverIds.length
    const nextRemove = toRemove[0]
    const canDelete = nextRemove != null && count > 1
    const canAdd = toAdd.length > 0 && count < ATTACHMENT_MAX_FILES

    if (canDelete && (count >= ATTACHMENT_MAX_FILES || !canAdd)) {
      latest = await deleteLeaveAttachment(leaveId, nextRemove)
      toRemove.shift()
      serverIds = latest.attachments.map((file) => file.id)
      continue
    }

    if (canAdd) {
      const slots = ATTACHMENT_MAX_FILES - count
      const batch = toAdd.splice(0, slots)
      latest = await addLeaveAttachments(leaveId, batch)
      serverIds = latest.attachments.map((file) => file.id)
      continue
    }

    throw new Error('Unable to update attachments. Keep at least one file.')
  }

  return latest
}

/** POST /leaves/{id}/cancel — cancel an open request; returns detail. */
export async function cancelLeave(
  leaveId: number,
  payload: CancelLeavePayload,
): Promise<LeaveDetail> {
  return apiPostData<LeaveDetail>(`/leaves/${leaveId}/cancel`, payload)
}

/** Same-origin path for GET /leaves/{id}/attachments/{attachmentId}. */
export function leaveAttachmentPath(
  leaveId: number,
  attachmentId: number,
): string {
  return `/api/leaves/${leaveId}/attachments/${attachmentId}`
}
