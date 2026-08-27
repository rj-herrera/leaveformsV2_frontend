import { axiosClient } from './axios-client'

/** Single reminder sent today — disable that leave+approver button only. */
export type AdminReminderPair = {
  leave_id: number
  approver_emp_id: number
}

/** GET /admin/reminders — plain JSON (no `{ data }` wrap). */
export type AdminReminderStats = {
  approver_count: number
  request_count: number
  /** Last successful bulk send (Manila offset); null if never. */
  last_sent_at: string | null
  /** false if mail off or bulk already sent today. */
  can_send: boolean
  /** Always false — bulk does not lock singles; ignore for button gating. */
  singles_locked: boolean
  /** Singles sent today — disable those buttons only. */
  reminded_pairs: AdminReminderPair[]
}

/** POST /admin/reminders and POST /leaves/{id}/reminders — plain JSON. */
export type AdminReminderSendResult = {
  approver_count: number
  request_count: number
  email_count: number
  sent_at: string
}

/** GET /admin/reminders — banner stats (admin only). */
export async function getAdminReminderStats(): Promise<AdminReminderStats> {
  const { data } = await axiosClient.get<AdminReminderStats>('/admin/reminders')
  return data
}

/** POST /admin/reminders — org-wide generic reminder (admin only). */
export async function sendAdminBulkReminder(): Promise<AdminReminderSendResult> {
  const { data } = await axiosClient.post<AdminReminderSendResult>(
    '/admin/reminders',
  )
  return data
}

/** POST /leaves/{id}/reminders — one waiting approver on that leave (admin only). */
export async function sendLeaveReminder(
  leaveId: number,
  approverEmpId: number,
): Promise<AdminReminderSendResult> {
  const { data } = await axiosClient.post<AdminReminderSendResult>(
    `/leaves/${leaveId}/reminders`,
    { approver_emp_id: approverEmpId },
  )
  return data
}

export function isReminderPairReminded(
  pairs: AdminReminderPair[] | undefined,
  leaveId: number,
  approverEmpId: number,
): boolean {
  if (!pairs || pairs.length === 0) return false
  return pairs.some(
    (pair) =>
      Number(pair.leave_id) === Number(leaveId) &&
      Number(pair.approver_emp_id) === Number(approverEmpId),
  )
}

function lastSentAtFromErrorBody(body: unknown): string | null {
  if (
    body &&
    typeof body === 'object' &&
    'last_sent_at' in body &&
    typeof (body as { last_sent_at: unknown }).last_sent_at === 'string'
  ) {
    return (body as { last_sent_at: string }).last_sent_at
  }
  return null
}

/** Optimistic GET cache after a successful bulk send (does not lock singles). */
export function statsAfterBulkSend(
  current: AdminReminderStats | undefined,
  result: AdminReminderSendResult,
): AdminReminderStats {
  return {
    approver_count: result.approver_count,
    request_count: result.request_count,
    last_sent_at: result.sent_at,
    can_send: false,
    singles_locked: false,
    reminded_pairs: current?.reminded_pairs ?? [],
  }
}

/** Optimistic GET cache after a successful single send (does not lock bulk). */
export function statsAfterSingleSend(
  current: AdminReminderStats | undefined,
  leaveId: number,
  approverEmpId: number,
): AdminReminderStats {
  const pairs = current?.reminded_pairs ?? []
  const already = isReminderPairReminded(pairs, leaveId, approverEmpId)
  return {
    approver_count: current?.approver_count ?? 0,
    request_count: current?.request_count ?? 0,
    last_sent_at: current?.last_sent_at ?? null,
    can_send: current?.can_send ?? true,
    singles_locked: current?.singles_locked ?? false,
    reminded_pairs: already
      ? pairs
      : [...pairs, { leave_id: leaveId, approver_emp_id: approverEmpId }],
  }
}

/**
 * After 429: refresh lock flags from message when possible, then revalidate.
 * Bulk-today locks bulk only; pair-already-reminded only needs that pair flagged.
 */
export function statsAfterReminder429(
  current: AdminReminderStats | undefined,
  body: unknown,
  context: { leaveId?: number; approverEmpId?: number },
): AdminReminderStats | undefined {
  if (!current) return current

  const message =
    body &&
    typeof body === 'object' &&
    'message' in body &&
    typeof (body as { message: unknown }).message === 'string'
      ? (body as { message: string }).message
      : ''

  const lastSent = lastSentAtFromErrorBody(body) ?? current.last_sent_at

  if (message.includes('org-wide reminder was already sent')) {
    return {
      ...current,
      last_sent_at: lastSent,
      can_send: false,
      singles_locked: false,
    }
  }

  if (
    message.includes('already reminded for this leave') &&
    context.leaveId != null &&
    context.approverEmpId != null
  ) {
    return statsAfterSingleSend(current, context.leaveId, context.approverEmpId)
  }

  return {
    ...current,
    last_sent_at: lastSent,
  }
}
