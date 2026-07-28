/**
 * TODO(REPLACE): Employee activity log mock — replace with API feed.
 */
import { MOCK_DATA_ENABLED } from './config'

export type ActivityLogEntry = {
  id: string
  occurredAt: string
  activity: string
  leaveType: string
  balanceImpact: string
  performedBy: string
  remarks: string | null
}

/** Mutable store so adjust/distribution mocks can append entries. */
export const MOCK_ACTIVITY_LOG: ActivityLogEntry[] = [
  {
    id: 'act-1',
    occurredAt: '2026-07-01T09:15:00',
    activity: 'Leave request submitted',
    leaveType: 'Vacation Leave',
    balanceImpact: '3.0 VL reserved',
    performedBy: 'Alex Employee',
    remarks: null,
  },
  {
    id: 'act-2',
    occurredAt: '2026-07-08T11:05:00',
    activity: 'Leave request approved',
    leaveType: 'Vacation Leave',
    balanceImpact: 'No change',
    performedBy: 'Jordan Approver',
    remarks: null,
  },
  {
    id: 'act-3',
    occurredAt: '2026-06-20T10:15:00',
    activity: 'Leave request approved',
    leaveType: 'Sick Leave',
    balanceImpact: 'No change',
    performedBy: 'Jordan Approver',
    remarks: null,
  },
  {
    id: 'act-4',
    occurredAt: '2026-06-20T09:00:00',
    activity: 'Leave request submitted',
    leaveType: 'Sick Leave',
    balanceImpact: '1.0 SL reserved',
    performedBy: 'Alex Employee',
    remarks: null,
  },
  {
    id: 'act-5',
    occurredAt: '2026-06-16T10:00:00',
    activity: 'Leave request approved',
    leaveType: 'Vacation Leave',
    balanceImpact: 'No change',
    performedBy: 'Jordan Approver',
    remarks: null,
  },
  {
    id: 'act-6',
    occurredAt: '2026-06-15T08:30:00',
    activity: 'Leave request submitted',
    leaveType: 'Vacation Leave',
    balanceImpact: '3.0 VL reserved',
    performedBy: 'Alex Employee',
    remarks: null,
  },
]

export function getActivityLogEntries(): ActivityLogEntry[] {
  if (!MOCK_DATA_ENABLED) return []
  return [...MOCK_ACTIVITY_LOG].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt),
  )
}

export function appendActivityLogEntry(
  entry: Omit<ActivityLogEntry, 'id'> & { id?: string },
): ActivityLogEntry {
  const full: ActivityLogEntry = {
    id: entry.id ?? `act-${Date.now()}-${MOCK_ACTIVITY_LOG.length + 1}`,
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

export function formatActivityTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function matchesActivityLeaveType(
  entryLeaveType: string,
  filter: string,
): boolean {
  if (filter === 'ALL') return true
  if (entryLeaveType === filter) return true
  return entryLeaveType.includes(filter)
}
