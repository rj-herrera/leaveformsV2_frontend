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
  originalAttachment: string | null
  requestedLeaveType: string
  conversionRequestDate: string
  conversionReason: string
  conversionAttachment: string | null
  reviewedBy: string | null
  reviewedAtLabel?: string
  rejectionReason?: string
}
