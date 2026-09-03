import { apiGetList, apiPostData, apiPostFormData } from './axios-client'
import type {
  LeaveConversionResource,
  RejectConversionPayload,
} from './types'

/** `to_code` on POST /leaves/{id}/conversion. Omit / SL defaults to sick leave. */
export type ConversionTargetCode = 'SL' | 'EL'

/** POST /leaves/{id}/conversion — multipart files + required `reason` (201). */
export async function requestConversion(
  leaveId: number,
  files: File[],
  reason: string,
  toCode: ConversionTargetCode = 'SL',
): Promise<LeaveConversionResource> {
  const form = new FormData()
  const fileField = toCode === 'EL' ? 'leave_attachment[]' : 'med_cert[]'
  for (const file of files) {
    form.append(fileField, file)
  }
  form.append('reason', reason)
  if (toCode === 'EL') {
    form.append('to_code', 'EL')
  }
  return apiPostFormData<LeaveConversionResource>(
    `/leaves/${leaveId}/conversion`,
    form,
  )
}

/** GET /conversions/pending — admin inbox. */
export async function listPendingConversions(): Promise<
  LeaveConversionResource[]
> {
  const { data } = await apiGetList<LeaveConversionResource>(
    '/conversions/pending',
  )
  return data
}

/** POST /conversions/{id}/approve */
export async function approveConversion(
  conversionId: number,
): Promise<LeaveConversionResource> {
  return apiPostData<LeaveConversionResource>(
    `/conversions/${conversionId}/approve`,
  )
}

/** POST /conversions/{id}/reject — remarks required. */
export async function rejectConversion(
  conversionId: number,
  payload: RejectConversionPayload,
): Promise<LeaveConversionResource> {
  return apiPostData<LeaveConversionResource>(
    `/conversions/${conversionId}/reject`,
    payload,
  )
}

/** Same-origin path for GET /conversions/{id}/attachments/{attachmentId}. */
export function conversionAttachmentPath(
  conversionId: number,
  attachmentId: number,
): string {
  return `/api/conversions/${conversionId}/attachments/${attachmentId}`
}

