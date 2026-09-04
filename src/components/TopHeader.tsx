import { Menu } from 'lucide-react'

type TopHeaderProps = {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export function TopHeader({
  sidebarCollapsed,
  onToggleSidebar,
}: TopHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-white pl-4 pr-6">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="inline-flex size-9 items-center justify-center rounded-md text-text-gray transition-colors hover:bg-background hover:text-text-black"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Menu className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>
    </header>
  )
}
