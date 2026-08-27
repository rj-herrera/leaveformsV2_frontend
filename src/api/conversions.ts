import { apiGetList, apiPostData, apiPostFormData } from './axios-client'
import type {
  LeaveConversionResource,
  RejectConversionPayload,
} from './types'

/** POST /leaves/{id}/conversion — multipart `med_cert` + required `reason` (201). */
export async function requestConversion(
  leaveId: number,
  medCert: File,
  reason: string,
): Promise<LeaveConversionResource> {
  const form = new FormData()
  form.append('med_cert', medCert)
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

/** Relative path for GET /conversions/{id}/med-cert. */
export function conversionMedCertPath(conversionId: number): string {
  return `/api/conversions/${conversionId}/med-cert`
}
