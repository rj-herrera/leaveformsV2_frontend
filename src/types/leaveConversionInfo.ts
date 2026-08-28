import type { ConversionStatus } from '../api/types'

/** Display model for original vs conversion request panels. */
export type LeaveConversionInfo = {
  status: ConversionStatus
  originalLeaveType: string
  originalDayType: string
  originalDateFiled: string
  originalLeavePeriod: string
  filedBy: string
  originalReason: string
  originalAttachmentCount: number
  requestedLeaveType: string
  conversionRequestDate: string
  conversionReason: string
  conversionAttachmentCount: number
  reviewedBy: string | null
  reviewedAtLabel?: string
  rejectionReason?: string
}
