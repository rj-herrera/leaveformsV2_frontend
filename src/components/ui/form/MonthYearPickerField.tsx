import { useId, useLayoutEffect, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  fieldControlClassName,
  fieldLabelClassName,
  fieldShellClassName,
} from './fieldStyles'

/** Short month labels for the 3×4 grid. */
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr',
  'May', 'Jun', 'Jul', 'Aug',
  'Sep', 'Oct', 'Nov', 'Dec',
] as const

const POPOVER_WIDTH = 240
const POPOVER_ESTIMATED_HEIGHT = 220

type PopoverPosition = { top: number; left: number }

/** Parses a "YYYY-MM" string into { year, monthIndex } or null. */
function parseMonthYear(value: string): { year: number; monthIndex: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  if (monthIndex < 0 || monthIndex > 11) return null
  return { year, monthIndex }
}

/** Formats a "YYYY-MM" value into "Month YYYY" display, or fallback. */
function formatDisplay(value: string, emptyLabel: string): string {
  const parsed = parseMonthYear(value)
  if (!parsed) return emptyLabel
  return new Date(parsed.year, parsed.monthIndex, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function toMonthValue(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

type MonthYearPickerFieldProps = {
  label: string
  value: string          // "YYYY-MM" or ""
  onChange: (value: string) => void
  /** Label shown on the trigger when nothing is selected. Default "Select month" */
  emptyLabel?: string
  /** When true, shows an "All Months" option that clears the value. */
  allowClear?: boolean
  className?: string
  disabled?: boolean
  /** Tailwind height class for the trigger button, e.g. "h-[2.375rem]". */
  controlHeight?: string
  /** Show label above the trigger. Default true. */
  showLabel?: boolean
}

/**
 * Custom Month + Year picker styled like DateFieldCustom:
 * portal-based fixed popover, year navigation row, 3×4 month grid, "This month" shortcut.
 */
export function MonthYearPickerField({
  label,
  value,
  onChange,
  emptyLabel = 'Select month',
  allowClear = false,
  className = '',
  disabled = false,
  controlHeight,
  showLabel = true,
}: MonthYearPickerFieldProps) {
  const popoverId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<PopoverPosition | null>(null)

  const now = new Date()
  const todayYear = now.getFullYear()
  const todayMonth = now.getMonth()

  // The year currently displayed in the popover for navigation
  const [viewYear, setViewYear] = useState<number>(() => {
    const parsed = parseMonthYear(value)
    return parsed ? parsed.year : todayYear
  })

  // Sync viewYear when value changes externally
  useEffect(() => {
    const parsed = parseMonthYear(value)
    if (parsed) setViewYear(parsed.year)
  }, [value])

  function updatePosition() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return

    let left = rect.left
    left = Math.min(left, window.innerWidth - POPOVER_WIDTH - 8)
    left = Math.max(8, left)

    const spaceBelow = window.innerHeight - rect.bottom
    const openAbove =
      spaceBelow < POPOVER_ESTIMATED_HEIGHT && rect.top > POPOVER_ESTIMATED_HEIGHT

    const top = openAbove
      ? Math.max(8, rect.top - POPOVER_ESTIMATED_HEIGHT - 6)
      : rect.bottom + 6

    setPosition({ top, left })
  }

  useLayoutEffect(() => {
    if (!open) { setPosition(null); return }
    updatePosition()
  }, [open])

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) return
      setOpen(false)
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    function onReposition() { updatePosition() }

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
  }, [open])

  function handleSelect(monthIndex: number) {
    onChange(toMonthValue(viewYear, monthIndex))
    setOpen(false)
  }

  function handleThisMonth() {
    setViewYear(todayYear)
    onChange(toMonthValue(todayYear, todayMonth))
    setOpen(false)
  }

  function handleClear() {
    onChange('')
    setOpen(false)
  }

  const selectedParsed = parseMonthYear(value)

  // When controlHeight is supplied we drop py-2.5 / min-h-11 from fieldControlClassName
  // so the fixed height class wins without conflict.
  const baseControlClass = controlHeight
    ? fieldControlClassName
        .replace('min-h-11', '')
        .replace('py-2.5', '')
        .trim()
    : fieldControlClassName

  const triggerClass = [
    'flex w-full items-center justify-between gap-2 text-left',
    controlHeight ?? '',
    disabled
      ? `cursor-not-allowed rounded-md border border-border bg-surface-muted px-3 text-body leading-normal text-text-black opacity-60 outline-none ${controlHeight ?? 'py-2.5'}`
      : baseControlClass,
  ].join(' ')

  const popover =
    open && position
      ? createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            aria-label={`Choose ${label}`}
            style={{ top: position.top, left: position.left, width: POPOVER_WIDTH }}
            className="fixed z-50 rounded-lg border border-border bg-surface p-3 shadow-sm"
          >
            {/* Year navigation */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                aria-label="Previous year"
                onClick={() => setViewYear((y) => y - 1)}
                className="rounded-md p-1.5 text-text-gray transition-colors hover:bg-surface-muted hover:text-text-black"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-small font-semibold text-text-black">
                {viewYear}
              </span>
              <button
                type="button"
                aria-label="Next year"
                onClick={() => setViewYear((y) => y + 1)}
                className="rounded-md p-1.5 text-text-gray transition-colors hover:bg-surface-muted hover:text-text-black"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* 3×4 month grid */}
            <div className="grid grid-cols-3 gap-1">
              {MONTH_LABELS.map((name, idx) => {
                const isSelected =
                  selectedParsed !== null &&
                  selectedParsed.year === viewYear &&
                  selectedParsed.monthIndex === idx
                const isToday = viewYear === todayYear && idx === todayMonth

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    className={[
                      'rounded-md py-1.5 text-small font-medium transition-colors',
                      isSelected
                        ? 'bg-primary text-white'
                        : isToday
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-black hover:bg-surface-muted',
                    ].join(' ')}
                  >
                    {name}
                  </button>
                )
              })}
            </div>

            {/* Footer actions */}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
              {allowClear ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-small font-medium text-text-gray transition-colors hover:text-text-black"
                >
                  {value ? 'Clear' : 'All Months'}
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={handleThisMonth}
                className="text-small font-medium text-primary transition-opacity hover:opacity-75"
              >
                This month
              </button>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div className={`min-w-0 ${className}`}>
      {showLabel ? (
        <span className={fieldLabelClassName}>{label}</span>
      ) : null}
      <div className={fieldShellClassName}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          aria-label={label}
          onClick={() => { if (!disabled) setOpen((prev) => !prev) }}
          className={triggerClass}
        >
          <span className={value ? 'text-text-black' : 'text-text-gray'}>
            {formatDisplay(value, emptyLabel)}
          </span>
          <CalendarDays className="size-4 shrink-0 text-text-gray" aria-hidden="true" />
        </button>
      </div>
      {popover}
    </div>
  )
}
