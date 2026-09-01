import { formatLongDateTime } from './leaveDisplay'

/** Format GET /admin/reminders `last_sent_at` for the All-tab banner. */
export function formatReminderSentLabel(lastSentIso: string | null): string {
  if (!lastSentIso) return 'Never'
  const formatted = formatLongDateTime(lastSentIso)
  if (formatted === lastSentIso) return 'Never'
  return formatted
}
