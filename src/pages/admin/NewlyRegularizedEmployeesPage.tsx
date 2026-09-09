import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import type { AdminNewlyRegularizedRow } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { ClearFiltersButton } from '../../components/ui/EmptyState'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { Pagination } from '../../components/ui/Pagination'
import { TableBodySkeleton } from '../../components/ui/Skeleton'
import {
  TABLE_AVAILABLE_SLOT,
  TABLE_CONTENT_AREA,
  TABLE_CONTENT_SECTION,
  TABLE_PAGE_ROOT,
  TABLE_PAGINATION_PLACEHOLDER,
  TABLE_PAGINATION_WRAP,
} from '../../components/ui/tableLayout'
import { TableEmptyRow } from '../../components/ui/TableEmptyRow'
import {
  TABLE_BODY_ROW_BORDER_CLASS,
  TABLE_SEARCH_INPUT_CLASS,
  APPROVALS_TABLE_ROW_HEIGHT,
  APPROVALS_TABLE_ROW_HEIGHT_CLASS,
} from '../../components/ui/tableStyles'
import { useAdminGroups } from '../../hooks/api/useAdminGroups'
import { useAdminNewlyRegularized } from '../../hooks/api/useAdminNewlyRegularized'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import { usePagination } from '../../hooks/usePagination'
import {
  formatDisplayDate,
  setNewlyRegularizedDraft,
  type NewlyRegularizedSelectLocationState,
} from '../../utils/newlyRegularizedDraft'
import {
  distributionReviewPath,
  leaveBalancesLandingPath,
} from '../../utils/distributionPaths'

type GroupFilter = 'ALL' | string

const FETCH_PER_PAGE = 500
const PAGE_SIZE_DEBOUNCE_MS = 150

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])

  return debounced
}

function groupLabelOf(row: AdminNewlyRegularizedRow): string {
  return (
    row.employee.group?.abbreviation ?? row.employee.group?.name ?? '—'
  )
}

function readSelectLocationState(
  state: unknown,
): NewlyRegularizedSelectLocationState | null {
  if (!state || typeof state !== 'object') return null
  const raw = state as Partial<NewlyRegularizedSelectLocationState>
  if (!Array.isArray(raw.empIds) || raw.empIds.length === 0) return null
  const empIds = raw.empIds
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0)
  if (empIds.length === 0) return null
  return {
    empIds,
    groupFilter:
      typeof raw.groupFilter === 'string' ? raw.groupFilter : 'ALL',
  }
}

export function NewlyRegularizedEmployeesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
    pageSize: measuredPageSize,
  } = useContentSizedTableRefs({ fallbackRowHeight: APPROVALS_TABLE_ROW_HEIGHT })
  const pageSize = useDebouncedValue(measuredPageSize, PAGE_SIZE_DEBOUNCE_MS)
  const headerCheckboxRef = useRef<HTMLInputElement>(null)

  const [restoreFromReview] = useState(() =>
    readSelectLocationState(location.state),
  )

  useEffect(() => {
    if (location.state == null) return
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>(
    () => (restoreFromReview?.groupFilter as GroupFilter) || 'ALL',
  )
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(restoreFromReview?.empIds ?? []),
  )

  const { data: adminGroups } = useAdminGroups()

  const listParams = useMemo(
    () => ({
      sort: 'asc' as const,
      page: 1,
      per_page: FETCH_PER_PAGE,
    }),
    [],
  )

  const { data, error, isLoading } = useAdminNewlyRegularized(listParams)

  const allRows = data?.data ?? []
  const year = data?.meta?.year

  const groupOptions = useMemo(() => {
    const fromApi = (adminGroups ?? []).map((group) => ({
      value: String(group.id),
      label: group.abbreviation ?? group.name ?? String(group.id),
    }))
    if (fromApi.length > 0) {
      return [{ value: 'ALL' as const, label: 'All Groups' }, ...fromApi]
    }
    const labels = Array.from(
      new Set(allRows.map(groupLabelOf).filter((label) => label !== '—')),
    ).sort((a, b) => a.localeCompare(b))
    return [
      { value: 'ALL' as const, label: 'All Groups' },
      ...labels.map((label) => ({ value: label, label })),
    ]
  }, [adminGroups, allRows])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return allRows.filter((row) => {
      const emp = row.employee
      const name = (emp.name ?? '').toLowerCase()
      const number = emp.employee_number.toLowerCase()
      const matchesSearch =
        query.length === 0 || name.includes(query) || number.includes(query)

      let matchesGroup = true
      if (groupFilter !== 'ALL') {
        if (adminGroups && adminGroups.length > 0) {
          matchesGroup = String(emp.group?.id ?? '') === groupFilter
        } else {
          matchesGroup = groupLabelOf(row) === groupFilter
        }
      }

      return matchesSearch && matchesGroup
    })
  }, [allRows, search, groupFilter, adminGroups])

  const filterResetKey = [search, groupFilter].join('|')
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    totalItems,
  } = usePagination(filteredRows, pageSize, filterResetKey)

  const pendingInFilter = filteredRows.filter((row) => !row.already_granted)
  const pendingIdsInFilter = pendingInFilter.map((row) => row.employee.id)
  const selectedPendingInFilter = pendingIdsInFilter.filter((id) =>
    selectedIds.has(id),
  )
  const allPendingSelected =
    pendingIdsInFilter.length > 0 &&
    selectedPendingInFilter.length === pendingIdsInFilter.length
  const somePendingSelected =
    selectedPendingInFilter.length > 0 &&
    selectedPendingInFilter.length < pendingIdsInFilter.length

  useEffect(() => {
    const el = headerCheckboxRef.current
    if (el) el.indeterminate = somePendingSelected
  }, [somePendingSelected])

  const showSkeleton = isLoading && !data
  const hasActiveFilters = search.trim().length > 0 || groupFilter !== 'ALL'
  const canContinue = selectedIds.size > 0 && year != null
  const pendingTotal = allRows.filter((row) => !row.already_granted).length

  function clearFilters() {
    setSearch('')
    setGroupFilter('ALL')
  }

  function toggleId(id: number, alreadyGranted: boolean) {
    if (alreadyGranted) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllPendingFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPendingSelected) {
        for (const id of pendingIdsInFilter) next.delete(id)
      } else {
        for (const id of pendingIdsInFilter) next.add(id)
      }
      return next
    })
  }

  function handleContinue() {
    if (!canContinue || year == null) return
    setNewlyRegularizedDraft({
      year,
      empIds: Array.from(selectedIds),
      groupFilter,
    })
    navigate(distributionReviewPath('newly-regularized'))
  }

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <Link
        to={leaveBalancesLandingPath()}
        className="text-body inline-flex w-fit shrink-0 items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Leave Balances
      </Link>

      <h1 className="shrink-0 text-h1 text-text-black">
        Select eligible employees
      </h1>

      <div ref={availableSlotRef} className={TABLE_AVAILABLE_SLOT}>
        <section
          className={`${TABLE_CONTENT_SECTION} rounded-lg border border-border bg-surface`}
        >
          <div
            ref={sectionHeaderRef}
            className="flex shrink-0 flex-col gap-3 border-b border-border px-5 py-4"
          >
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative block min-w-0 w-full flex-1">
                <span className="sr-only">Search employee name or number</span>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-gray"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employee name or number"
                  className={TABLE_SEARCH_INPUT_CLASS}
                />
              </label>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <FilterSelect
                  label="Filter by group"
                  value={groupFilter}
                  onChange={setGroupFilter}
                  options={groupOptions}
                  selectHeight="h-[2.125rem]"
                />
              </div>
            </div>
          </div>

          <div ref={tableAreaRef} className={TABLE_CONTENT_AREA}>
            <table className="w-full min-w-[960px] table-fixed text-left">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[10%]" />
                <col className="w-[16%]" />
                <col className="w-[17%]" />
                <col className="w-[22%]" />
              </colgroup>
              <thead>
                <tr className="h-11 border-b border-border bg-surface-muted text-small text-text-gray">
                  <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allPendingSelected}
                      disabled={
                        pendingIdsInFilter.length === 0 || showSkeleton
                      }
                      onChange={toggleSelectAllPendingFiltered}
                      aria-label="Select all pending employees matching filters"
                      className="size-4 accent-primary disabled:cursor-not-allowed"
                    />
                  </th>
                  <th className="px-3 py-3 font-bold uppercase tracking-wide">
                    Employee No.
                  </th>
                  <th className="px-3 py-3 font-bold uppercase tracking-wide">
                    Employee Name
                  </th>
                  <th className="px-3 py-3 font-bold uppercase tracking-wide">
                    Group
                  </th>
                  <th className="px-3 py-3 font-bold uppercase tracking-wide">
                    Date Hired
                  </th>
                  <th className="px-3 py-3 font-bold uppercase tracking-wide">
                    Regularization Date
                  </th>
                  <th className="px-3 py-3 font-bold uppercase tracking-wide">
                    Months of Service
                  </th>
                </tr>
              </thead>
              <tbody>
                {showSkeleton ? (
                  <TableBodySkeleton
                    rows={pageSize}
                    cols={7}
                    rowClassName={APPROVALS_TABLE_ROW_HEIGHT_CLASS}
                  />
                ) : error && !data ? (
                  <TableEmptyRow
                    colSpan={7}
                    pageSize={pageSize}
                    rowHeight={APPROVALS_TABLE_ROW_HEIGHT}
                    variant="no-data"
                    message="Unable to load eligible employees. Please try again."
                  />
                ) : paginatedItems.length === 0 ? (
                  <TableEmptyRow
                    colSpan={7}
                    pageSize={pageSize}
                    rowHeight={APPROVALS_TABLE_ROW_HEIGHT}
                    variant={hasActiveFilters ? 'no-results' : 'no-data'}
                    action={
                      hasActiveFilters ? (
                        <ClearFiltersButton onClick={clearFilters} />
                      ) : undefined
                    }
                  />
                ) : (
                  paginatedItems.map((row) => (
                    <CandidateRow
                      key={row.employee.id}
                      row={row}
                      checked={selectedIds.has(row.employee.id)}
                      onToggle={() =>
                        toggleId(row.employee.id, row.already_granted)
                      }
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div ref={paginationRef} className={TABLE_PAGINATION_WRAP}>
            {!showSkeleton ? (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            ) : (
              <div className={TABLE_PAGINATION_PLACEHOLDER} aria-hidden="true">
                <p className="text-small text-transparent">Showing 0 results</p>
                <div className="h-9.5" />
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <p className="text-small text-text-gray">
          {selectedIds.size} selected
          {data ? ` · ${pendingTotal} pending this year` : null}
        </p>
        <Button
          variant="primary"
          disabled={!canContinue}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

function CandidateRow({
  row,
  checked,
  onToggle,
}: {
  row: AdminNewlyRegularizedRow
  checked: boolean
  onToggle: () => void
}) {
  const emp = row.employee
  const groupLabel = groupLabelOf(row)
  const disabled = row.already_granted

  return (
    <tr
      className={`${APPROVALS_TABLE_ROW_HEIGHT_CLASS} ${TABLE_BODY_ROW_BORDER_CLASS} ${disabled ? 'opacity-60' : ''}`}
    >
      <td className="px-3 text-center">
        <input
          type="checkbox"
          checked={checked && !disabled}
          disabled={disabled}
          onChange={onToggle}
          aria-label={
            disabled
              ? `${emp.name ?? 'Employee'} already granted`
              : `Select ${emp.name ?? 'employee'}`
          }
          title={disabled ? 'Already granted this year' : undefined}
          className="size-4 accent-primary disabled:cursor-not-allowed"
        />
      </td>
      <td className="px-3 text-body text-text-black">{emp.employee_number}</td>
      <td
        className="truncate px-3 text-body text-text-black"
        title={emp.name ?? undefined}
      >
        {emp.name ?? '—'}
      </td>
      <td className="px-3 text-body text-text-black">{groupLabel}</td>
      <td className="px-3 text-body text-text-black">
        {formatDisplayDate(row.date_hired)}
      </td>
      <td className="px-3 text-body text-text-black">
        {formatDisplayDate(row.regularization_date)}
      </td>
      <td className="px-3 text-body text-text-black">
        {row.months_of_service || '—'}
      </td>
    </tr>
  )
}
