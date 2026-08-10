import { ArrowDown, ArrowUp } from 'lucide-react'

export type SortDirection = 'asc' | 'desc'

export function SortableHeader({
  label,
  active,
  direction,
  onToggle,
  align = 'left',
}: {
  label: string
  active: boolean
  direction: SortDirection
  onToggle: () => void
  align?: 'left' | 'center'
}) {
  return (
    <div
      className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : ''}`}
    >
      <span>{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex rounded p-0.5 text-text-gray transition-colors hover:bg-background hover:text-text-black"
        aria-label={`Sort ${label} ${active && direction === 'desc' ? 'ascending' : 'descending'}`}
      >
        {active && direction === 'asc' ? (
          <ArrowUp className="size-3.5" aria-hidden="true" />
        ) : (
          <ArrowDown className="size-3.5" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
