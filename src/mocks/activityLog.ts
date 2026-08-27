/**
 * Mutable activity-log store used by admin leave-balance mock mutations
 * (adjust credits / distributions). Employee Activity Log reads the API.
 */
export type ActivityLogEntry = {
  id: string
  /** Target employee for this activity */
  employeeId?: string
  occurredAt: string
  activity: string
  leaveType: string
  balanceImpact: string
  performedBy: string
  remarks: string | null
}

/** Mutable store so adjust/distribution mocks can append entries. */
export const MOCK_ACTIVITY_LOG: ActivityLogEntry[] = []

export function appendActivityLogEntry(
  entry: Omit<ActivityLogEntry, 'id'> & { id?: string },
): ActivityLogEntry {
  const full: ActivityLogEntry = {
    id: entry.id ?? `act-${Date.now()}-${MOCK_ACTIVITY_LOG.length + 1}`,
    employeeId: entry.employeeId,
    occurredAt: entry.occurredAt,
    activity: entry.activity,
    leaveType: entry.leaveType,
    balanceImpact: entry.balanceImpact,
    performedBy: entry.performedBy,
    remarks: entry.remarks,
  }
  MOCK_ACTIVITY_LOG.unshift(full)
  return full
}
