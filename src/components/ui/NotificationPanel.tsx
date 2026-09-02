import { useEffect, useRef, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { EmptyState } from './EmptyState'
import type { NotificationItem } from '../../mocks/notifications'
import { formatShortDate, parseWallClockDateTime } from '../../utils/leaveDisplay'

type NotificationFilter = 'all' | 'unread'

type NotificationPanelProps = {
  open: boolean
  onClose: () => void
  notifications: NotificationItem[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  /** Clicks on this element are ignored for outside-close (e.g. bell button). */
  anchorRef?: RefObject<HTMLElement | null>
}

function formatNotificationTime(iso: string): string {
  const date = parseWallClockDateTime(iso)
  if (Number.isNaN(date.getTime())) return iso

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return formatShortDate(iso)
}

/**
 * Floating notifications panel. Pass a typed `notifications` list so mock
 * data can later be swapped for an API response without changing the UI.
 */
export function NotificationPanel({
  open,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  anchorRef,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (panelRef.current?.contains(target)) return
      if (anchorRef?.current?.contains(target)) return
      onClose()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose, anchorRef])

  useEffect(() => {
    if (!open) setFilter('all')
  }, [open])

  if (!open) return null

  const unreadCount = notifications.reduce(
    (count, item) => count + (item.read ? 0 : 1),
    0,
  )
  const visibleNotifications =
    filter === 'unread'
      ? notifications.filter((item) => !item.read)
      : notifications

  function handleItemClick(item: NotificationItem) {
    if (!item.read) onMarkRead(item.id)
    if (item.href) {
      onClose()
      navigate(item.href)
    }
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      className="absolute top-full right-0 z-50 mt-2 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl ring-1 ring-black/5"
    >
      <div className="border-b border-border px-4 pt-3 pb-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-body font-semibold text-text-black">
            Notifications
          </h2>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-small font-medium text-primary transition-colors hover:text-primary/80"
            >
              Mark all as read
            </button>
          ) : null}
        </div>

        <div
          className="inline-flex w-full rounded-md border border-border bg-surface-muted p-0.5"
          role="group"
          aria-label="Notification filters"
        >
          <FilterTab
            label="All"
            selected={filter === 'all'}
            onSelect={() => setFilter('all')}
            count={notifications.length}
          />
          <FilterTab
            label="Unread"
            selected={filter === 'unread'}
            onSelect={() => setFilter('unread')}
            count={unreadCount}
          />
        </div>
      </div>

      {visibleNotifications.length === 0 ? (
        <EmptyState
          variant={filter === 'unread' ? 'no-results' : 'no-data'}
          icon={Bell}
          message={
            filter === 'unread'
              ? 'No unread notifications'
              : 'No notifications yet'
          }
          className="px-4 py-10"
        />
      ) : (
        <ul className="max-h-80 overflow-y-auto" role="list">
          {visibleNotifications.map((item, index) => (
            <li
              key={item.id}
              className={index > 0 ? 'border-t border-border' : undefined}
            >
              <button
                type="button"
                onClick={() => handleItemClick(item)}
                className={[
                  'flex w-full gap-3 px-4 py-3 text-left transition-colors',
                  item.read
                    ? 'bg-surface hover:bg-surface-muted/50'
                    : 'bg-surface-muted/60 hover:bg-surface-muted',
                ].join(' ')}
              >
                <span
                  className={[
                    'mt-1.5 size-2 shrink-0 rounded-full',
                    item.read ? 'bg-transparent' : 'bg-secondary',
                  ].join(' ')}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={[
                        'text-body text-text-black',
                        item.read ? 'font-medium' : 'font-semibold',
                      ].join(' ')}
                    >
                      {item.title}
                    </p>
                    <time
                      dateTime={item.createdAt}
                      className="text-small shrink-0 text-text-gray"
                    >
                      {formatNotificationTime(item.createdAt)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-small text-text-gray">
                    {item.message}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function FilterTab({
  label,
  selected,
  onSelect,
  count,
}: {
  label: string
  selected: boolean
  onSelect: () => void
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        'flex-1 rounded px-3 py-1 text-small font-medium transition-colors',
        selected
          ? 'bg-surface text-text-black shadow-sm'
          : 'text-text-gray hover:text-text-black',
      ].join(' ')}
    >
      {label}
      <span className="ml-1.5 tabular-nums opacity-70">({count})</span>
    </button>
  )
}
