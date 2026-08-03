/**
 * TODO(REPLACE): Notifications mock — replace with API feed.
 */
import { MOCK_DATA_ENABLED } from './config'

export type NotificationItem = {
  id: string
  title: string
  message: string
  /** ISO datetime string */
  createdAt: string
  read: boolean
  /** Optional deep-link for future navigation */
  href?: string
}

/** Mutable store so future mark-as-read / push mocks can update entries. */
export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Leave request approved',
    message:
      'Your Vacation Leave request for Jul 14–16, 2026 has been approved.',
    createdAt: '2026-07-30T14:20:00',
    read: false,
    href: '/dashboard',
  },
  {
    id: 'notif-2',
    title: 'Pending approval',
    message:
      'Alex Employee submitted a Sick Leave request awaiting your review.',
    createdAt: '2026-07-30T10:05:00',
    read: false,
    href: '/team/leave-approvals',
  },
  {
    id: 'notif-3',
    title: 'Leave credits distributed',
    message:
      'Annual leave credits have been posted to your balance for 2026.',
    createdAt: '2026-07-29T09:00:00',
    read: true,
    href: '/dashboard',
  },
  {
    id: 'notif-4',
    title: 'Leave request returned',
    message:
      'Your Emergency Leave request was returned. Please review the remarks and resubmit.',
    createdAt: '2026-07-28T16:45:00',
    read: true,
    href: '/my-leave/activity-log',
  },
]

function snapshotNotifications(): NotificationItem[] {
  return MOCK_NOTIFICATIONS.map((item) => ({ ...item }))
}

export function getNotifications(): NotificationItem[] {
  if (!MOCK_DATA_ENABLED) return []
  return snapshotNotifications()
}

export function getUnreadNotificationCount(
  items: NotificationItem[] = getNotifications(),
): number {
  return items.reduce((count, item) => count + (item.read ? 0 : 1), 0)
}

/** Marks one notification as read and returns a fresh snapshot for React state. */
export function markNotificationRead(id: string): NotificationItem[] {
  const item = MOCK_NOTIFICATIONS.find((entry) => entry.id === id)
  if (item) item.read = true
  return getNotifications()
}

/** Marks all notifications as read and returns a fresh snapshot for React state. */
export function markAllNotificationsRead(): NotificationItem[] {
  for (const item of MOCK_NOTIFICATIONS) {
    item.read = true
  }
  return getNotifications()
}
