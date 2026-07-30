import { useId, useLayoutEffect, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  fieldControlClassName,
  fieldLabelClassName,
  fieldShellClassName,
} from './fieldStyles'

const POPOVER_WIDTH = 240
const POPOVER_ESTIMATED_HEIGHT = 200
/** Number of years shown in the popover grid (3×4). */
const YEAR_WINDOW = 12

type PopoverPosition = { top: number; left: number }

function decadeStart(year: number): number {
  return Math.floor(year / YEAR_WINDOW) * YEAR_WINDOW
}

type YearPickerFieldProps = {
  label: string
  /** Selected year, or null when cleared / empty. */
  value: number | null
  onChange: (value: number | null) => void
  /** Label shown on the trigger when nothing is selected. Default "Select year" */
  emptyLabel?: string
  /** When true, shows a Clear option that sets value to null. */
  allowClear?: boolean
  className?: string
  disabled?: boolean
  /** Tailwind height class for the trigger button, e.g. "h-[2.375rem]". */
  controlHeight?: string
  /** Show label above the trigger. Default true. */
  showLabel?: boolean
  /** Inclusive lower bound for selectable years. */
  minYear?: number
  /** Inclusive upper bound for selectable years. */
  maxYear?: number
}

/**
 * Custom Year picker styled like MonthYearPickerField:
 * portal-based fixed popover, decade window navigation, 3×4 year grid, "This year" shortcut.
 */
export function YearPickerField({
  label,
  value,
  onChange,
  emptyLabel = 'Select year',
  allowClear = false,
  className = '',
  disabled = false,
  controlHeight,
  showLabel = true,
  minYear = 2000,
  maxYear = 2100,
}: YearPickerFieldProps) {
  const popoverId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<PopoverPosition | null>(null)

  const todayYear = new Date().getFullYear()

  const [viewStart, setViewStart] = useState<number>(() =>
    decadeStart(value ?? todayYear),
  )

  useEffect(() => {
    if (value != null) setViewStart(decadeStart(value))
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
    if (!open) {
      setPosition(null)
      return
    }
    updatePosition()
  }, [open])

  useEffect(() => {
    if (!open) return

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
  }, [open])

  function handleSelect(year: number) {
    onChange(year)
    setOpen(false)
  }

  function handleThisYear() {
    const year = Math.min(maxYear, Math.max(minYear, todayYear))
    setViewStart(decadeStart(year))
    onChange(year)
    setOpen(false)
  }

  function handleClear() {
    onChange(null)
    setOpen(false)
  }

  const years = Array.from({ length: YEAR_WINDOW }, (_, i) => viewStart + i)
  const rangeLabel = `${viewStart} – ${viewStart + YEAR_WINDOW - 1}`

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

  const displayLabel = value != null ? String(value) : emptyLabel

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
            {/* Decade / window navigation */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                aria-label="Previous years"
                onClick={() => setViewStart((start) => start - YEAR_WINDOW)}
                className="rounded-md p-1.5 text-text-gray transition-colors hover:bg-surface-muted hover:text-text-black"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-small font-semibold text-text-black">
                {rangeLabel}
              </span>
              <button
                type="button"
                aria-label="Next years"
                onClick={() => setViewStart((start) => start + YEAR_WINDOW)}
                className="rounded-md p-1.5 text-text-gray transition-colors hover:bg-surface-muted hover:text-text-black"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* 3×4 year grid */}
            <div className="grid grid-cols-3 gap-1">
              {years.map((year) => {
                const outOfRange = year < minYear || year > maxYear
                const isSelected = value === year
                const isToday = year === todayYear

                return (
                  <button
                    key={year}
                    type="button"
                    disabled={outOfRange}
                    onClick={() => handleSelect(year)}
                    className={[
                      'rounded-md py-1.5 text-small font-medium transition-colors',
                      outOfRange
                        ? 'cursor-not-allowed text-text-gray/40'
                        : isSelected
                          ? 'bg-primary text-white'
                          : isToday
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-black hover:bg-surface-muted',
                    ].join(' ')}
                  >
                    {year}
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
                  Clear
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={handleThisYear}
                className="text-small font-medium text-primary transition-opacity hover:opacity-75"
              >
                This year
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
          onClick={() => {
            if (!disabled) setOpen((prev) => !prev)
          }}
          className={triggerClass}
        >
          <span className={value != null ? 'text-text-black' : 'text-text-gray'}>
            {displayLabel}
          </span>
          <CalendarDays className="size-4 shrink-0 text-text-gray" aria-hidden="true" />
        </button>
      </div>
      {popover}
    </div>
  )
}
