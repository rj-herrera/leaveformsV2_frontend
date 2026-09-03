import type { LeaveDetail } from '../api/types'

/** Confirmed VL, no pending/approved conversion, and viewer is the employee on leave. */
export function canRequestConversion(
  detail: LeaveDetail,
  viewerEmpId: string,
): boolean {
  if (detail.status !== 'confirmed') return false
  if (detail.leave_type.code.toUpperCase() !== 'VL') return false
  if (String(detail.emp_id) !== String(viewerEmpId)) return false
  if (detail.conversion == null) return true
  return detail.conversion.status === 'rejected'
}
