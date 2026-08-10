import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  EmptyState,
  type EmptyStateVariant,
} from './EmptyState'

type TableEmptyRowProps = {
  colSpan: number
  /** Rows that would fit the viewport — empty body height matches a full page. */
  pageSize: number
  /** Pixel height of one data row (e.g. `TABLE_ROW_HEIGHT`, `APPROVALS_TABLE_ROW_HEIGHT`). */
  rowHeight: number
  variant?: EmptyStateVariant
  message?: string
  icon?: LucideIcon
  /** Optional control under the message (e.g. Clear Filters). */
  action?: ReactNode
}

/**
 * Single tbody row that fills `pageSize × rowHeight` and centers `EmptyState`.
 * Uses a colspan cell so Pattern A measurement skips it as a sample data row.
 */
export function TableEmptyRow({
  colSpan,
  pageSize,
  rowHeight,
  variant,
  message,
  icon,
  action,
}: TableEmptyRowProps) {
  const height = Math.max(1, pageSize) * rowHeight

  return (
    <tr>
      <td
        colSpan={colSpan}
        className="p-0 align-middle"
        style={{ height }}
      >
        <div className="flex h-full w-full items-stretch justify-center">
          <EmptyState
            variant={variant}
            message={message}
            icon={icon}
            action={action}
            className="h-full w-full"
          />
        </div>
      </td>
    </tr>
  )
}
