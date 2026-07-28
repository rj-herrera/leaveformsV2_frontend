import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { isWeekday } from '../../../utils/leaveDates'
import {
  fieldControlClassName,
  fieldControlDisabledClassName,
  fieldControlReadOnlyClassName,
  fieldLabelClassName,
  fieldShellClassName,
} from './fieldStyles'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const
const POPOVER_WIDTH = 280
const POPOVER_ESTIMATED_HEIGHT = 320

type DateFieldCustomProps = {
  label: string
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  disabled?: boolean
  name?: string
  id?: string
  hint?: string
  className?: string
  /** When true, Saturday and Sunday cannot be selected */
  weekdaysOnly?: boolean
  min?: string
  max?: string
}

function parseISODate(iso: string): Date | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplay(iso: string): string {
  const date = parseISODate(iso)
  if (!date) return 'Select date'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

type PopoverPosition = {
  top: number
  left: number
}

/** Custom date field with calendar icon + month grid popover. */
export function DateFieldCustom({
  label,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  name,
  id,
  hint,
  className = '',
  weekdaysOnly = false,
  min,
  max,
}: DateFieldCustomProps) {
  const inputId = id ?? name ?? label.replace(/\s+/g, '-').toLowerCase()
  const popoverId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<PopoverPosition | null>(null)
  const isLocked = readOnly || disabled

  const selected = parseISODate(value)
  const minDate = parseISODate(min ?? '')
  const maxDate = parseISODate(max ?? '')
  const [viewMonth, setViewMonth] = useState(() => {
    const d = selected ?? new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const controlClass = readOnly
    ? fieldControlReadOnlyClassName
    : disabled
      ? fieldControlDisabledClassName
      : fieldControlClassName

  useEffect(() => {
    if (isLocked) setOpen(false)
  }, [isLocked])

  function updatePosition() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return

    let left = rect.left
    left = Math.min(left, window.innerWidth - POPOVER_WIDTH - 8)
    left = Math.max(8, left)

    const spaceBelow = window.innerHeight - rect.bottom
    const openAbove =
      spaceBelow < POPOVER_ESTIMATED_HEIGHT &&
      rect.top > POPOVER_ESTIMATED_HEIGHT

    const top = openAbove
      ? Math.max(8, rect.top - POPOVER_ESTIMATED_HEIGHT - 6)
      : rect.bottom + 6

    setPosition({ top, left })
  }

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    updatePosition()
  }, [open])

  useEffect(() => {
    if (!open) return

    const selectedDate = parseISODate(value)
    if (selectedDate) {
      setViewMonth(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      )
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    // Capture scroll from any overflow ancestor so the popover stays aligned
    function onReposition() {
      updatePosition()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onReposition)
    document.addEventListener('scroll', onReposition, true)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onReposition)
      document.removeEventListener('scroll', onReposition, true)
    }
  }, [open, value])

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const popover =
    open && position
      ? createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            aria-label={`Choose ${label}`}
            style={{ top: position.top, left: position.left }}
            className="fixed z-50 w-[280px] rounded-lg border border-border bg-surface p-3 shadow-md"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                className="rounded-md p-1.5 text-text-gray transition-colors hover:bg-surface-muted hover:text-text-black"
                aria-label="Previous month"
                onClick={() => setViewMonth(new Date(year, month - 1, 1))}
              >
                <ChevronLeft className="size-4" />
              </button>
              <p className="text-small font-semibold text-text-black">
                {viewMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <button
                type="button"
                className="rounded-md p-1.5 text-text-gray transition-colors hover:bg-surface-muted hover:text-text-black"
                aria-label="Next month"
                onClick={() => setViewMonth(new Date(year, month + 1, 1))}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-0.5 text-center">
              {WEEKDAYS.map((day) => (
                <span
                  key={day}
                  className="py-1 text-small font-medium text-text-gray"
                >
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 text-center">
              {cells.map((day, index) => {
                if (day === null) {
                  return <span key={`empty-${index}`} className="h-8" />
                }

                const cellDate = new Date(year, month, day)
                const iso = toISODate(cellDate)
                const isSelected = selected
                  ? sameDay(cellDate, selected)
                  : false
                const isToday = sameDay(cellDate, today)
                const isWeekend = !isWeekday(cellDate)
                const beforeMin = minDate ? cellDate < minDate : false
                const afterMax = maxDate ? cellDate > maxDate : false
                const isDisabled =
                  (weekdaysOnly && isWeekend) || beforeMin || afterMax

                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) return
                      onChange(iso)
                      setOpen(false)
                    }}
                    className={`h-8 rounded-md text-small transition-colors ${
                      isDisabled
                        ? 'cursor-not-allowed text-text-gray/40'
                        : isSelected
                          ? 'bg-primary font-semibold text-white'
                          : isToday
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-text-black hover:bg-surface-muted'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={inputId} className={fieldLabelClassName}>
        {label}
      </label>
      <div className={fieldShellClassName}>
        <button
          ref={triggerRef}
          type="button"
          id={inputId}
          disabled={isLocked}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          onClick={() => {
            if (!isLocked) setOpen((prev) => !prev)
          }}
          className={`flex items-center justify-between gap-2 text-left ${controlClass}`}
        >
          <span className={value ? 'text-text-black' : 'text-text-gray'}>
            {formatDisplay(value)}
          </span>
          <Calendar
            className="size-4 shrink-0 text-text-gray"
            aria-hidden="true"
          />
        </button>
      </div>

      {hint ? (
        <p className="mt-1 text-small text-text-gray">{hint}</p>
      ) : null}

      {popover}
    </div>
  )
}
