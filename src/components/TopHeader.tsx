import { useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import { NotificationPanel } from './ui/NotificationPanel'
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../mocks/notifications'

type TopHeaderProps = {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export function TopHeader({
  sidebarCollapsed,
  onToggleSidebar,
}: TopHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState(getNotifications)
  const bellRef = useRef<HTMLButtonElement>(null)

  const unreadCount = getUnreadNotificationCount(notifications)

  function handleMarkRead(id: string) {
    setNotifications(markNotificationRead(id))
  }

  function handleMarkAllRead() {
    setNotifications(markAllNotificationsRead())
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-white pl-4 pr-6">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="inline-flex size-9 items-center justify-center rounded-md text-text-gray transition-colors hover:bg-background hover:text-text-black"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Menu className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="relative">
        <button
          ref={bellRef}
          type="button"
          className="relative rounded-md p-2 text-text-gray hover:bg-background hover:text-text-black"
          aria-label="Notifications"
          aria-haspopup="dialog"
          aria-expanded={notificationsOpen}
          onClick={() => setNotificationsOpen((prev) => !prev)}
        >
          <BellIcon />
          {unreadCount > 0 ? (
            <span
              className="absolute top-1.5 right-1.5 size-2 rounded-full bg-secondary"
              aria-hidden="true"
            />
          ) : null}
        </button>

        <NotificationPanel
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          anchorRef={bellRef}
        />
      </div>
    </header>
  )
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="size-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  )
}
