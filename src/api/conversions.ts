import { apiGetList, apiPostData, apiPostFormData } from './axios-client'
import type {
  LeaveConversionResource,
  RejectConversionPayload,
} from './types'

/** POST /leaves/{id}/conversion — multipart `med_cert[]` (1–5 files) + required `reason` (201). */
export async function requestConversion(
  leaveId: number,
  medCerts: File[],
  reason: string,
): Promise<LeaveConversionResource> {
  const form = new FormData()
  for (const file of medCerts) {
    form.append('med_cert[]', file)
  }
  form.append('reason', reason)
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

