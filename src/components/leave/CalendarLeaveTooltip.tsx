import { Clock, UserRound, BookUser } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { TeamCalendarEntry } from '../../api/types'
import { formatDayTypeLabel } from '../../utils/leaveDates'

type TooltipPosition = {
  top: number
  left: number
}

function groupLabel(entry: TeamCalendarEntry): string {
  const group = entry.employee?.group
  if (!group) return '—'
  // return group.abbreviation?.trim() || group.name?.trim() || '—'
  return group.name?.trim() || '—'
}

type CalendarLeaveTooltipProps = {
  entry: TeamCalendarEntry
  children: React.ReactElement
}

export function CalendarLeaveTooltip({
  entry,
  children,
}: CalendarLeaveTooltipProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<TooltipPosition | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  function computePosition() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPosition({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2 + window.scrollX,
    })
  }

  function show() {
    computePosition()
    setVisible(true)
  }

  function hide() {
    setVisible(false)
  }

  useEffect(() => {
    if (!visible) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') hide()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [visible])

  const name = entry.employee?.name?.trim() || '—'
  const dayType = formatDayTypeLabel(entry.day_type)
  const group = groupLabel(entry)

  const tooltip =
    visible && position
      ? createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            style={{
              position: 'fixed',
              top: position.top - 8,
              left: position.left,
              transform: 'translate(-50%, -100%)',
              zIndex: 70,
            }}
            className="pointer-events-none w-48 rounded-lg border border-border bg-surface px-3 py-2.5 shadow-[0_4px_14px_rgba(33,37,41,0.12)]"
          >
            <ul className="space-y-1.5">
              <TooltipRow icon={<UserRound className="size-3.5 shrink-0 text-text-gray" aria-hidden="true" />} label={name} />
              <TooltipRow icon={<BookUser className="size-3.5 shrink-0 text-text-gray" aria-hidden="true" />} label={group !== '—' ? `${group}` : '—'} />
              <TooltipRow icon={<Clock className="size-3.5 shrink-0 text-text-gray" aria-hidden="true" />} label={dayType} />
            </ul>
            {/* Downward caret */}
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-full -translate-x-1/2 border-6 border-transparent border-t-border"
            />
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-full -translate-x-1/2 border-[7px] border-transparent border-t-surface"
              style={{ marginTop: '-1px' }}
            />
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="cursor-default"
      >
        {children}
      </div>
      {tooltip}
    </>
  )
}

function TooltipRow({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <li className="flex items-center gap-2">
      {icon}
      <span className="min-w-0 truncate text-small text-text-black">{label}</span>
    </li>
  )
}
