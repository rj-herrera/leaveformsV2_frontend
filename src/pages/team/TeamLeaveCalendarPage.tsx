import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import type { TeamCalendarEntry } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { EmptyState } from '../../components/ui/EmptyState'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { CalendarGridSkeleton, SidePanelListSkeleton } from '../../components/ui/Skeleton'
import { CalendarLeaveTooltip } from '../../components/leave/CalendarLeaveTooltip'
import {
  getLeaveTypeAvatarClasses,
  getLeaveTypeChipClasses,
} from '../../constants/leaveTypeTheme'
import { useTeamCalendar } from '../../hooks/api/useTeamCalendar'
import { useHolidays } from '../../hooks/api/useHolidays'
import { formatLeavePeriod, formatLeaveTypeName } from '../../utils/leaveDisplay'
import { todayISO } from '../../utils/leaveDates'
import {
  LEAVE_TYPE_FILTER_OPTIONS,
  type LeaveTypeFilter,
} from '../../utils/leaveFiling'
import {
  addDaysIso,
  formatLongDateLabel,
  formatMonthYearLabel,
  formatWeekRangeLabel,
  getMonthSelectOptions,
  getMonthWeekdayWeeks,
  getWeekdayWeek,
  indexCalendarEntriesByDate,
  monthValue,
  parseMonthValue,
  rangeFromCells,
  startOfWeekMonday,
  WEEKDAY_LABELS,
  type CalendarDayCell,
} from '../../utils/teamCalendarGrid'

type CalendarView = 'month' | 'week'
type GroupFilter = 'ALL' | string

function groupOptionLabel(group: {
  abbreviation: string | null
  name: string | null
  id: number
}): string {
  return group.abbreviation?.trim() || group.name?.trim() || String(group.id)
}

function employeeName(entry: TeamCalendarEntry): string {
  return entry.employee?.name?.trim() || '—'
}

function leaveTypeLabel(entry: TeamCalendarEntry): string {
  return formatLeaveTypeName(entry.leave_type)
}

function groupLabel(entry: TeamCalendarEntry): string {
  const group = entry.employee?.group
  if (!group) return '—'
  return group.abbreviation?.trim() || group.name?.trim() || '—'
}

export function TeamLeaveCalendarPage() {
  const { user } = useAuth()
  const today = todayISO()
  const initialNow = useMemo(() => new Date(), [])

  const [view, setView] = useState<CalendarView>('month')
  const [viewMonth, setViewMonth] = useState(() =>
    monthValue(initialNow.getFullYear(), initialNow.getMonth()),
  )
  const [weekMonday, setWeekMonday] = useState(() => startOfWeekMonday(today))
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<LeaveTypeFilter>('ALL')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [monthMenuOpen, setMonthMenuOpen] = useState(false)
  const monthMenuRef = useRef<HTMLDivElement>(null)

  const parsed = parseMonthValue(viewMonth) ?? {
    year: initialNow.getFullYear(),
    monthIndex: initialNow.getMonth(),
  }

  const monthOptions = useMemo(
    () => getMonthSelectOptions(initialNow),
    [initialNow],
  )

  const groupOptions = useMemo(
    () => [
      { value: 'ALL' as const, label: 'All Groups' },
      ...user.picGroups.map((group) => ({
        value: String(group.id),
        label: groupOptionLabel(group),
      })),
    ],
    [user.picGroups],
  )

  const monthWeeks = useMemo(
    () => getMonthWeekdayWeeks(parsed.year, parsed.monthIndex, today),
    [parsed.year, parsed.monthIndex, today],
  )

  const weekDays = useMemo(
    () => getWeekdayWeek(weekMonday, today),
    [weekMonday, today],
  )

  const visibleRange = useMemo(
    () =>
      view === 'month' ? rangeFromCells(monthWeeks) : rangeFromCells(weekDays),
    [view, monthWeeks, weekDays],
  )

  const listParams = useMemo(() => {
    if (!visibleRange) return null
    return {
      from: visibleRange.from,
      to: visibleRange.to,
      code: leaveTypeFilter === 'ALL' ? undefined : leaveTypeFilter,
      group_id: groupFilter === 'ALL' ? undefined : Number(groupFilter),
    }
  }, [visibleRange, leaveTypeFilter, groupFilter])

  const todayParams = useMemo(
    () => ({
      from: today,
      to: today,
      code: leaveTypeFilter === 'ALL' ? undefined : leaveTypeFilter,
      group_id: groupFilter === 'ALL' ? undefined : Number(groupFilter),
    }),
    [today, leaveTypeFilter, groupFilter],
  )

  const upcomingParams = useMemo(
    () => ({
      from: addDaysIso(today, 1),
      to: addDaysIso(today, 61),
      code: leaveTypeFilter === 'ALL' ? undefined : leaveTypeFilter,
      group_id: groupFilter === 'ALL' ? undefined : Number(groupFilter),
    }),
    [today, leaveTypeFilter, groupFilter],
  )

  const { data, error, isLoading, isValidating } = useTeamCalendar(listParams)
  const holidayParams = visibleRange ?? { from: today, to: today }
  const { data: holidayRows } = useHolidays(holidayParams)
  const {
    data: todayData,
    error: todayError,
    isLoading: todayLoading,
  } = useTeamCalendar(todayParams)
  const {
    data: upcomingData,
    error: upcomingError,
    isLoading: upcomingLoading,
  } = useTeamCalendar(upcomingParams)

  const entries = data ?? []
  const entriesByDate = useMemo(
    () => indexCalendarEntriesByDate(entries),
    [entries],
  )
  const holidayNames = useMemo(() => {
    const names = new Map<string, string>()
    for (const row of holidayRows ?? []) {
      if (!row.is_non_working) continue
      const label = row.name.trim()
      if (label) names.set(row.date, label)
    }
    return names
  }, [holidayRows])
  const onLeaveToday = todayData ?? []
  const upcomingLeaves = useMemo(() => {
    if (!upcomingData) return []
    return [...upcomingData]
      .filter((entry) => entry.start_date > today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .slice(0, 5)
  }, [upcomingData, today])

  const showSkeleton = isLoading && !data
  const showStale = Boolean(isValidating && data && !showSkeleton)
  const showTodaySkeleton = todayLoading && !todayData
  const showUpcomingSkeleton = upcomingLoading && !upcomingData

  useEffect(() => {
    if (!monthMenuOpen) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (monthMenuRef.current && !monthMenuRef.current.contains(target)) {
        setMonthMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [monthMenuOpen])

  function handleMonthChange(next: string) {
    setViewMonth(next)
    setMonthMenuOpen(false)
    const nextParsed = parseMonthValue(next)
    if (!nextParsed) return
    const firstWeekday = startOfWeekMonday(
      `${nextParsed.year}-${String(nextParsed.monthIndex + 1).padStart(2, '0')}-01`,
    )
    setWeekMonday(firstWeekday)
  }

  function shiftMonth(deltaMonths: number) {
    const next = new Date(parsed.year, parsed.monthIndex + deltaMonths, 1)
    handleMonthChange(monthValue(next.getFullYear(), next.getMonth()))
  }

  function handleViewChange(next: CalendarView) {
    setView(next)
    setMonthMenuOpen(false)
    if (next === 'week') {
      const monthIso = `${parsed.year}-${String(parsed.monthIndex + 1).padStart(2, '0')}-01`
      const todayInMonth = today.startsWith(
        `${parsed.year}-${String(parsed.monthIndex + 1).padStart(2, '0')}`,
      )
      setWeekMonday(startOfWeekMonday(todayInMonth ? today : monthIso))
    }
  }

  function shiftWeek(deltaWeeks: number) {
    const nextMonday = addDaysIso(weekMonday, deltaWeeks * 7)
    setWeekMonday(nextMonday)
    const mondayDate = new Date(`${nextMonday}T00:00:00`)
    setViewMonth(monthValue(mondayDate.getFullYear(), mondayDate.getMonth()))
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-h1 text-text-black">Team Leave Calendar</h1>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Leave type"
            value={leaveTypeFilter}
            onChange={(value) => setLeaveTypeFilter(value as LeaveTypeFilter)}
            options={LEAVE_TYPE_FILTER_OPTIONS}
          />
          <FilterSelect
            label="Group"
            value={groupFilter}
            onChange={setGroupFilter}
            options={groupOptions}
          />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <div className="flex min-w-0 items-center gap-2">
              {view === 'month' ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    className="rounded-md p-1 text-text-gray transition-colors hover:bg-surface-muted hover:text-text-black"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </button>

                  <div className="relative" ref={monthMenuRef}>
                    <button
                      type="button"
                      onClick={() => setMonthMenuOpen((open) => !open)}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-h2 text-text-black transition-colors hover:bg-surface-muted"
                      aria-haspopup="listbox"
                      aria-expanded={monthMenuOpen}
                      aria-label="Select month and year"
                    >
                      {formatMonthYearLabel(parsed.year, parsed.monthIndex)}
                    </button>

                    {monthMenuOpen ? (
                      <ul
                        role="listbox"
                        className="absolute top-full left-1/2 z-20 mt-1 max-h-60 w-44 -translate-x-1/2 overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-sm"
                      >
                        {monthOptions.map((option) => {
                          const selected = option.value === viewMonth
                          return (
                            <li key={option.value}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={() => handleMonthChange(option.value)}
                                className={`w-full px-3 py-1.5 text-left text-body transition-colors hover:bg-surface-muted ${
                                  selected
                                    ? 'font-medium text-primary'
                                    : 'text-text-black'
                                }`}
                              >
                                {option.label}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    className="rounded-md p-1 text-text-gray transition-colors hover:bg-surface-muted hover:text-text-black"
                    aria-label="Next month"
                  >
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => shiftWeek(-1)}
                    className="rounded-md p-1 text-text-gray transition-colors hover:bg-surface-muted hover:text-text-black"
                    aria-label="Previous week"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </button>
                  <p className="text-h2 text-text-black">
                    {formatWeekRangeLabel(weekMonday)}
                  </p>
                  <button
                    type="button"
                    onClick={() => shiftWeek(1)}
                    className="rounded-md p-1 text-text-gray transition-colors hover:bg-surface-muted hover:text-text-black"
                    aria-label="Next week"
                  >
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            <div
              className="inline-flex rounded-md border border-border bg-surface-muted p-0.5"
              role="group"
              aria-label="Calendar view"
            >
              <ViewToggle
                active={view === 'month'}
                onClick={() => handleViewChange('month')}
                label="Month"
              />
              <ViewToggle
                active={view === 'week'}
                onClick={() => handleViewChange('week')}
                label="Week"
              />
            </div>
          </div>

          <div
            className={[
              'flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4',
              showStale ? 'opacity-80' : '',
            ].join(' ')}
          >
            {showSkeleton ? (
              <CalendarGridSkeleton />
            ) : error && !data ? (
              <EmptyState
                variant="no-data"
                icon={CalendarDays}
                message="Unable to load the team calendar. Please try again."
                className="min-h-0 flex-1"
              />
            ) : view === 'month' ? (
              <MonthCalendarGrid
                weeks={monthWeeks}
                entriesByDate={entriesByDate}
                holidayNames={holidayNames}
              />
            ) : (
              <WeekCalendarGrid
                days={weekDays}
                entriesByDate={entriesByDate}
                holidayNames={holidayNames}
              />
            )}
          </div>
        </section>

        <aside className="grid min-h-0 grid-rows-2 gap-4 overflow-hidden">
          <article className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface p-4 sm:p-5">
            <h2 className="shrink-0 text-h2 text-text-black">On Leave Today</h2>
            <p className="mt-1 shrink-0 text-small text-text-gray">
              {formatLongDateLabel(today)}
            </p>

            {showTodaySkeleton ? (
              <SidePanelListSkeleton rows={3} />
            ) : todayError && !todayData ? (
              <EmptyState
                variant="no-data"
                icon={CalendarDays}
                message="Unable to load who is on leave today."
                className="mt-4 min-h-0 flex-1 px-2 py-3"
              />
            ) : onLeaveToday.length === 0 ? (
              <EmptyState
                variant="no-data"
                icon={CalendarDays}
                message="No employees are on leave today."
                className="mt-4 min-h-0 flex-1 px-2 py-3"
              />
            ) : (
              <ul className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
                {onLeaveToday.map((entry) => (
                  <li
                    key={entry.id}
                    className="border-b border-border/60 pb-2 last:border-b-0 last:pb-0"
                  >
                    <SidePanelLeaveRow entry={entry} />
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface p-4 sm:p-5">
            <h2 className="shrink-0 text-h2 text-text-black">Upcoming Leaves</h2>

            {showUpcomingSkeleton ? (
              <SidePanelListSkeleton rows={3} />
            ) : upcomingError && !upcomingData ? (
              <EmptyState
                variant="no-data"
                icon={CalendarDays}
                message="Unable to load upcoming leaves."
                className="mt-4 min-h-0 flex-1 px-2 py-3"
              />
            ) : upcomingLeaves.length === 0 ? (
              <EmptyState
                variant="no-data"
                icon={CalendarDays}
                message="No upcoming approved leaves for your team."
                className="mt-4 min-h-0 flex-1 px-2 py-3"
              />
            ) : (
              <ul className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
                {upcomingLeaves.map((entry) => (
                  <li
                    key={entry.id}
                    className="border-b border-border/60 pb-2 last:border-b-0 last:pb-0"
                  >
                    <SidePanelLeaveRow
                      entry={entry}
                      periodLabel={formatLeavePeriod(
                        entry.start_date,
                        entry.end_date,
                      )}
                    />
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/team/leave-calendar/upcoming"
              className="mt-3 inline-flex shrink-0 items-center gap-1 text-small font-semibold text-primary transition-colors hover:text-primary/80"
            >
              View all upcoming leaves
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </Link>
          </article>
        </aside>
      </div>
    </div>
  )
}

function ViewToggle({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded px-3 py-1 text-small font-medium transition-colors ${
        active
          ? 'bg-surface text-text-black shadow-sm'
          : 'text-text-gray hover:text-text-black'
      }`}
    >
      {label}
    </button>
  )
}

function MonthCalendarGrid({
  weeks,
  entriesByDate,
  holidayNames,
}: {
  weeks: CalendarDayCell[][]
  entriesByDate: Map<string, TeamCalendarEntry[]>
  holidayNames: ReadonlyMap<string, string>
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
      <div className="grid shrink-0 grid-cols-5 border-b border-border bg-surface-muted">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="border-r border-border px-2 py-2 text-center text-small font-semibold text-text-gray last:border-r-0"
          >
            {label}
          </div>
        ))}
      </div>

      <div
        className="grid min-h-0 flex-1"
        style={{
          gridTemplateRows: `repeat(${Math.max(weeks.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {weeks.map((week, weekIndex) => (
          <div
            key={`week-${weekIndex}`}
            className="grid min-h-0 grid-cols-5 border-b border-border last:border-b-0"
          >
            {week.map((cell, colIndex) => (
              <DayCell
                key={cell.iso}
                cell={cell}
                entries={
                  cell.inMonth ? (entriesByDate.get(cell.iso) ?? []) : []
                }
                holidayName={holidayNames.get(cell.iso)}
                isLastCol={colIndex === week.length - 1}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function WeekCalendarGrid({
  days,
  entriesByDate,
  holidayNames,
}: {
  days: CalendarDayCell[]
  entriesByDate: Map<string, TeamCalendarEntry[]>
  holidayNames: ReadonlyMap<string, string>
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
      <div className="grid shrink-0 grid-cols-5 border-b border-border bg-surface-muted">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="border-r border-border px-2 py-2 text-center text-small font-semibold text-text-gray last:border-r-0"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-5">
        {days.map((cell, colIndex) => (
          <DayCell
            key={cell.iso}
            cell={cell}
            entries={entriesByDate.get(cell.iso) ?? []}
            holidayName={holidayNames.get(cell.iso)}
            isLastCol={colIndex === days.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

function DayCell({
  cell,
  entries,
  holidayName,
  isLastCol,
}: {
  cell: CalendarDayCell
  entries: TeamCalendarEntry[]
  holidayName?: string
  isLastCol: boolean
}) {
  const isHoliday = Boolean(holidayName)

  return (
    <div
      title={holidayName}
      className={`flex min-h-0 flex-col overflow-hidden border-border p-1.5 sm:p-2 ${
        isLastCol ? '' : 'border-r'
      } ${
        !cell.inMonth
          ? 'bg-surface-muted/50'
          : isHoliday
            ? 'bg-secondary/15'
            : 'bg-surface'
      }`}
    >
      <div className="mb-1 shrink-0">
        <span
          className={`inline-flex size-6 items-center justify-center text-small font-semibold sm:size-7 ${
            cell.isToday
              ? 'rounded-full bg-primary text-text-white'
              : cell.inMonth
                ? 'text-text-black'
                : 'text-text-gray/50'
          }`}
        >
          {cell.dayOfMonth}
        </span>
        {holidayName ? (
          <p className="mt-0.5 truncate text-[0.65rem] font-semibold leading-tight text-text-gray">
            {holidayName}
          </p>
        ) : null}
      </div>

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {entries.map((entry) => (
          <li key={`${entry.id}-${cell.iso}`}>
            <CalendarLeaveChip entry={entry} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function CalendarLeaveChip({ entry }: { entry: TeamCalendarEntry }) {
  const typeLabel = leaveTypeLabel(entry)
  const name = employeeName(entry)
  const tone = getLeaveTypeChipClasses(typeLabel)

  return (
    <CalendarLeaveTooltip entry={entry}>
      <div className={`rounded-md border-l-4 px-1.5 py-1 ${tone}`}>
        <p className="truncate text-small font-semibold leading-tight text-text-black">
          {name}
        </p>
        <p className="truncate text-[0.65rem] leading-tight text-text-gray">
          {typeLabel}
        </p>
      </div>
    </CalendarLeaveTooltip>
  )
}

function SidePanelLeaveRow({
  entry,
}: {
  entry: TeamCalendarEntry
  periodLabel?: string
}) {
  const name = employeeName(entry)
  const typeLabel = leaveTypeLabel(entry)
  const group = groupLabel(entry)
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div
      className="flex items-center gap-3 rounded-md px-1 py-2"
    >
      <span
        className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-small font-semibold ${getLeaveTypeAvatarClasses(typeLabel)}`}
        aria-hidden="true"
      >
        {initials || '?'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-semibold text-text-black">
          {name}
        </span>
        <span className="block truncate text-small text-text-gray">
          {group} • {typeLabel}
        </span>
      </span>
    </div>
  )
}
