import { Menu } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

type TopHeaderProps = {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export function TopHeader({
  sidebarCollapsed,
  onToggleSidebar,
}: TopHeaderProps) {
  const { user } = useAuth()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-white pl-4 pr-6">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="inline-flex size-9 items-center justify-center rounded-md text-text-gray transition-colors hover:bg-background hover:text-text-black"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <Menu className="size-5" strokeWidth={2} aria-hidden="true" />
        ) : (
          <Menu className="size-5" strokeWidth={2} aria-hidden="true" />
        )}
      </button>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          className="relative rounded-md p-2 text-text-gray hover:bg-background hover:text-text-black"
          aria-label="Notifications"
        >
          <BellIcon />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-secondary" />
        </button>
        <div
          className="h-6 w-px bg-border"
          role="separator"
          aria-hidden="true"
        />
        <p className="text-[17.5px] text-text-gray">
          Hello, <span className="font-semibold text-primary">{user.name}</span>
        </p>
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
