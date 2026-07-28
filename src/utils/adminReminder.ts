/**
 * Once-per-day admin “Send Reminder to All” persistence (local until API exists).
 */
const STORAGE_KEY = 'kdt-admin-approver-reminder-last-sent'

export function getLastApproverReminderSentAt(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setLastApproverReminderSentAt(isoDateTime: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, isoDateTime)
  } catch {
    // ignore quota / private mode
  }
}

export function wasApproverReminderSentToday(
  lastSentIso: string | null,
  now = new Date(),
): boolean {
  if (!lastSentIso) return false
  const sent = new Date(lastSentIso)
  if (Number.isNaN(sent.getTime())) return false
  return (
    sent.getFullYear() === now.getFullYear() &&
    sent.getMonth() === now.getMonth() &&
    sent.getDate() === now.getDate()
  )
}

export function formatReminderSentLabel(lastSentIso: string | null): string {
  if (!lastSentIso) return 'Never'
  const date = new Date(lastSentIso)
  if (Number.isNaN(date.getTime())) return 'Never'
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
