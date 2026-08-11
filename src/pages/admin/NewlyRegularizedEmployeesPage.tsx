import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
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
import { TABLE_BODY_ROW_BORDER_CLASS, TABLE_SEARCH_INPUT_BASE_CLASS, APPROVALS_TABLE_ROW_HEIGHT, APPROVALS_TABLE_ROW_HEIGHT_CLASS } from '../../components/ui/tableStyles'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import { usePagination } from '../../hooks/usePagination'
import { shouldShowDataSkeleton } from '../../mocks/config'
import {
  computeRegularizationDate,
  formatDisplayDate,
  formatMonthsAndDays,
  getNewlyRegularizedCandidates,
  getNewlyRegularizedDraft,
  setNewlyRegularizedDraft,
  todayIsoDate,
  type NewlyRegularizedCandidate,
} from '../../mocks/leaveBalances'
import {
  distributionReviewPath,
  leaveBalancesLandingPath,
} from '../../utils/distributionPaths'

type GroupFilter = 'ALL' | string

const NEWLY_REG_EFFECTIVE_DATE = '2026-07-28'

export function NewlyRegularizedEmployeesPage() {
  const navigate = useNavigate()
  const {
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
    pageSize,
  } = useContentSizedTableRefs({ fallbackRowHeight: APPROVALS_TABLE_ROW_HEIGHT })
  const headerCheckboxRef = useRef<HTMLInputElement>(null)
  const showSkeleton = shouldShowDataSkeleton()

  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [selectionReady, setSelectionReady] = useState(false)

  /** Backend returns eligible-only; mock mirrors that. */
  const candidates = useMemo(
    () => getNewlyRegularizedCandidates().filter((c) => c.eligible),
    [],
  )

  useEffect(() => {
    if (selectionReady) return
    const draft = getNewlyRegularizedDraft()
    const eligibleIds = new Set(candidates.map((c) => c.employee.id))
    if (draft && draft.selectedEmployeeIds.length > 0) {
      setSelectedIds(
        new Set(draft.selectedEmployeeIds.filter((id) => eligibleIds.has(id))),
      )
      setGroupFilter((draft.groupFilter as GroupFilter) || 'ALL')
    } else {
      setSelectedIds(new Set(eligibleIds))
    }
    setSelectionReady(true)
  }, [candidates, selectionReady])

  const groupOptions = useMemo(() => {
    const groups = Array.from(
      new Set(candidates.map((c) => c.employee.groupLabel)),
    ).sort((a, b) => a.localeCompare(b))
    return [
      { value: 'ALL' as const, label: 'All Groups' },
      ...groups.map((group) => ({ value: group, label: group })),
    ]
  }, [candidates])

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase()
    return candidates.filter((c) => {
      const matchesSearch =
        query.length === 0 ||
        c.employee.name.toLowerCase().includes(query) ||
        c.employee.employeeNumber.toLowerCase().includes(query)
      const matchesGroup =
        groupFilter === 'ALL' || c.employee.groupLabel === groupFilter
      return matchesSearch && matchesGroup
    })
  }, [candidates, search, groupFilter])

  const filterResetKey = [search, groupFilter].join('|')
  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(filteredCandidates, pageSize, filterResetKey)

  const hasActiveFilters =
    search.trim().length > 0 || groupFilter !== 'ALL'

  function clearFilters() {
    setSearch('')
    setGroupFilter('ALL')
  }

  const filteredIds = filteredCandidates.map((c) => c.employee.id)
  const selectedInFilterCount = filteredIds.filter((id) =>
    selectedIds.has(id),
  ).length
  const allFilteredSelected =
    filteredIds.length > 0 && selectedInFilterCount === filteredIds.length
  const someFilteredSelected =
    selectedInFilterCount > 0 && selectedInFilterCount < filteredIds.length

  useEffect(() => {
    const el = headerCheckboxRef.current
    if (el) el.indeterminate = someFilteredSelected
  }, [someFilteredSelected])

  const canContinue = selectedIds.size > 0

  function toggleId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        for (const id of filteredIds) next.delete(id)
      } else {
        for (const id of filteredIds) next.add(id)
      }
      return next
    })
  }

  function handleContinue() {
    if (!canContinue) return
    setNewlyRegularizedDraft({
      selectedEmployeeIds: Array.from(selectedIds),
      groupFilter,
      effectiveDate: NEWLY_REG_EFFECTIVE_DATE,
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
        Select newly regularized employees
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
                  className={`${TABLE_SEARCH_INPUT_BASE_CLASS} py-1.5`}
                />
              </label>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <FilterSelect
                  label="Filter by group"
                  value={groupFilter}
                  onChange={setGroupFilter}
                  options={groupOptions}
                />
              </div>
            </div>
          </div>

          <div ref={tableAreaRef} className={TABLE_CONTENT_AREA}>
            <table className="w-full min-w-[960px] table-fixed text-left">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[20%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[16%]" />
                <col className="w-[17%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead>
                <tr className="h-11 border-b border-border bg-surface-muted text-small text-text-gray">
                  <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allFilteredSelected}
                      disabled={filteredIds.length === 0}
                      onChange={toggleSelectAllFiltered}
                      aria-label="Select all employees"
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
                {showSkeleton || !selectionReady ? (
                  <TableBodySkeleton
                    rows={pageSize}
                    cols={7}
                    rowClassName={APPROVALS_TABLE_ROW_HEIGHT_CLASS}
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
                      candidate={row}
                      checked={selectedIds.has(row.employee.id)}
                      onToggle={() => toggleId(row.employee.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div ref={paginationRef} className={TABLE_PAGINATION_WRAP}>
            {!showSkeleton && selectionReady ? (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredCandidates.length}
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

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
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
  candidate,
  checked,
  onToggle,
}: {
  candidate: NewlyRegularizedCandidate
  checked: boolean
  onToggle: () => void
}) {
  const { employee } = candidate
  const regularizationDate =
    employee.regularizationDate ?? computeRegularizationDate(employee.dateHired)

  return (
    <tr
      className={`${APPROVALS_TABLE_ROW_HEIGHT_CLASS} ${TABLE_BODY_ROW_BORDER_CLASS}`}
    >
      <td className="px-3 text-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Select ${employee.name}`}
          className="size-4 accent-primary"
        />
      </td>
      <td className="px-3 text-body text-text-black">
        {employee.employeeNumber}
      </td>
      <td
        className="truncate px-3 text-body text-text-black"
        title={employee.name}
      >
        {employee.name}
      </td>
      <td className="px-3 text-body text-text-black">{employee.groupLabel}</td>
      <td className="px-3 text-body text-text-black">
        {formatDisplayDate(employee.dateHired)}
      </td>
      <td className="px-3 text-body text-text-black">
        {formatDisplayDate(regularizationDate)}
      </td>
      <td className="px-3 text-body text-text-black">
        {formatMonthsAndDays(employee.dateHired, todayIsoDate())}
      </td>
    </tr>
  )
}
