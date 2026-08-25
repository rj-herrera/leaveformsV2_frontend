import useSWR from 'swr'
import { getAdminReminderStats } from '../../api/reminders'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/reminders` for GET /admin/reminders. */
export function useAdminReminders(enabled = true) {
  return useSWR(enabled ? swrKeys.adminReminders : null, getAdminReminderStats)
}
