import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Inbox, SearchX } from 'lucide-react'
import { Button } from './Button'

export type EmptyStateVariant = 'no-data' | 'no-results'

export const EMPTY_STATE_MESSAGE = {
  noData: 'No data to show',
  noResults: 'No results found',
} as const

type EmptyStateProps = {
  /** Defaults icon + copy when `message` / `icon` are omitted. */
  variant?: EmptyStateVariant
  message?: string
  icon?: LucideIcon
  /** Optional control under the message (e.g. Clear Filters). */
  action?: ReactNode
  className?: string
}

function defaultsForVariant(variant: EmptyStateVariant): {
  message: string
  icon: LucideIcon
} {
  if (variant === 'no-data') {
    return { message: EMPTY_STATE_MESSAGE.noData, icon: Inbox }
  }
  return { message: EMPTY_STATE_MESSAGE.noResults, icon: SearchX }
}

/** Shared Clear Filters control for filtered empty states. */
export function ClearFiltersButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="secondary" size="sm" onClick={onClick}>
      Clear Filters
    </Button>
  )
}

/**
 * Centered empty-state chrome: muted icon + one short message.
 * Use inside flex content areas, or via `TableEmptyRow` for tables.
 */
export function EmptyState({
  variant = 'no-results',
  message,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const defaults = defaultsForVariant(variant)
  const Icon = icon ?? defaults.icon
  const text = message ?? defaults.message

  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 px-5 py-6 text-center ${className ?? ''}`}
    >
      <Icon
        className="size-9 shrink-0 text-text-gray/40"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <p className="text-body text-text-gray">{text}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
