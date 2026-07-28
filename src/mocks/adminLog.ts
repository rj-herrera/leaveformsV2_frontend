/**
 * TODO(REPLACE): Administrative log mock store — replace with API.
 */
import { MOCK_DATA_ENABLED } from './config'

export type AdminLogEventType = 'BALANCE_ADJUSTMENT' | string

export type AdminLogEntry = {
  id: string
  eventType: AdminLogEventType
  occurredAt: string
  actorName: string
  targetEmployeeId: string
  targetEmployeeName: string
  leaveType: string
  direction: 'add' | 'deduct'
  amount: number
  before: number
  after: number
  effectiveDate: string
  reasonCategory: string
  reason: string
  ticketRef: string | null
}

const ADMIN_LOG: AdminLogEntry[] = []

export function getAdminLogEntries(): AdminLogEntry[] {
  if (!MOCK_DATA_ENABLED) return []
  return [...ADMIN_LOG].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt),
  )
}

export function appendAdminLogEntry(
  entry: Omit<AdminLogEntry, 'id'> & { id?: string },
): AdminLogEntry {
  const full: AdminLogEntry = {
    id: entry.id ?? `alog-${Date.now()}-${ADMIN_LOG.length + 1}`,
    eventType: entry.eventType,
    occurredAt: entry.occurredAt,
    actorName: entry.actorName,
    targetEmployeeId: entry.targetEmployeeId,
    targetEmployeeName: entry.targetEmployeeName,
    leaveType: entry.leaveType,
    direction: entry.direction,
    amount: entry.amount,
    before: entry.before,
    after: entry.after,
    effectiveDate: entry.effectiveDate,
    reasonCategory: entry.reasonCategory,
    reason: entry.reason,
    ticketRef: entry.ticketRef,
  }
  ADMIN_LOG.unshift(full)
  return full
}
