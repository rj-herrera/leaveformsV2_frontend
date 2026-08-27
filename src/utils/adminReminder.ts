/** Format GET /admin/reminders `last_sent_at` for the All-tab banner. */
export function formatReminderSentLabel(lastSentIso: string | null): string {
  if (!lastSentIso) return 'Never'
  const date = new Date(lastSentIso)
  if (Number.isNaN(date.getTime())) return 'Never'
  const datePart = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${datePart}, ${timePart}`
}
