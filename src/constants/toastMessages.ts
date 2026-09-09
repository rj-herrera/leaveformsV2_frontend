/** VL → SL / VL → EL conversion validation (Admin validate page). */
export const TOAST_LEAVE_CONVERSION_APPROVED =
  'Leave conversion request approved.'
export const TOAST_LEAVE_CONVERSION_REJECTED =
  'Leave conversion request rejected.'

/** Regular leave request approval/rejection (approver or admin acting as approver). */
export const TOAST_LEAVE_REQUEST_APPROVED =
  'Leave request approved.'
export const TOAST_LEAVE_REQUEST_REJECTED =
  'Leave request rejected.'

/** Admin bulk reminder to approvers with pending requests. */
export const TOAST_REMINDER_SENT_TO_ALL =
  'Reminder emails sent to approvers with pending leave requests.'

/** Admin single-approver reminder from leave request view. */
export const TOAST_REMINDER_SENT_TO_APPROVER =
  'Reminder email sent to the selected approver.'

/** Admin cancel of a confirmed leave. */
export const TOAST_CONFIRMED_LEAVE_CANCELLED =
  'Leave request cancelled.'

/** Admin leave credit adjustment. */
export function toastLeaveCreditsAdjusted(employeeName: string) {
  return `Leave credits for ${employeeName} updated.`
}

/** Admin annual leave credit distribution. */
export const TOAST_ANNUAL_DISTRIBUTION_APPLIED =
  'Annual leave credits distributed to selected employees.'

/** Admin contractual leave credit distribution. */
export const TOAST_CONTRACTUAL_DISTRIBUTION_APPLIED =
  'Leave credits distributed to selected contractual employees.'

/** Admin newly regularized leave credit distribution. */
export const TOAST_NEWLY_REGULARIZED_DISTRIBUTION_APPLIED =
  'Leave credits distributed to selected newly regularized employees.'
