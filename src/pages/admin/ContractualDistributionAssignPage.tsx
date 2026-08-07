import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { Button } from '../../components/ui/Button'
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
import { useContentSizedTablePageSize } from '../../hooks/useContentSizedTablePageSize'
import {
  APPROVALS_TABLE_ROW_HEIGHT,
  APPROVALS_TABLE_ROW_HEIGHT_CLASS,
} from '../../hooks/usePageSizeFromHeight'
import { usePagination } from '../../hooks/usePagination'
import { shouldShowDataSkeleton } from '../../mocks/config'
import {
  formatBalanceValue,
  getContractualCandidates,
  getContractualDistributionDraft,
  setContractualDistributionDraft,
  type ContractualAssignment,
  type LeaveBalanceEmployee,
} from '../../mocks/leaveBalances'
import {
  distributionReviewPath,
  leaveBalancesLandingPath,
} from '../../utils/distributionPaths'

type RowAmounts = {
  vlToAdd: string
  slToAdd: string
}

type GroupFilter = 'ALL' | string

const CONTRACTUAL_EFFECTIVE_DATE = '2026-07-28'

function parseAmount(value: string): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.round(n * 2) / 2
}

function amountsFromAssignments(
  assignments: ContractualAssignment[] | undefined,
): RowAmounts {
  let vlToAdd = ''
  let slToAdd = ''
  for (const a of assignments ?? []) {
    if (a.leaveTypeKey === 'vl' && a.amount > 0) vlToAdd = String(a.amount)
    if (a.leaveTypeKey === 'sl' && a.amount > 0) slToAdd = String(a.amount)
  }
  return { vlToAdd, slToAdd }
}

function buildAssignments(amounts: RowAmounts): ContractualAssignment[] {
  const list: ContractualAssignment[] = []
  const vl = parseAmount(amounts.vlToAdd)
  const sl = parseAmount(amounts.slToAdd)
  if (vl > 0) list.push({ leaveTypeKey: 'vl', amount: vl })
  if (sl > 0) list.push({ leaveTypeKey: 'sl', amount: sl })
  return list
}

function rowHasValidCredit(amounts: RowAmounts): boolean {
  return parseAmount(amounts.vlToAdd) > 0 || parseAmount(amounts.slToAdd) > 0
}

export function ContractualDistributionAssignPage() {
  const navigate = useNavigate()
  const availableSlotRef = useRef<HTMLDivElement>(null)
  const sectionHeaderRef = useRef<HTMLDivElement>(null)
  const paginationRef = useRef<HTMLDivElement>(null)
  const tableAreaRef = useRef<HTMLDivElement>(null)
  const headerCheckboxRef = useRef<HTMLInputElement>(null)
  const pageSize = useContentSizedTablePageSize(
    {
      availableSlotRef,
      sectionHeaderRef,
      paginationRef,
      tableAreaRef,
    },
    { fallbackRowHeight: APPROVALS_TABLE_ROW_HEIGHT },
  )
  const showSkeleton = shouldShowDataSkeleton()

  const candidates = useMemo(() => getContractualCandidates(), [])

  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [amountsById, setAmountsById] = useState<Record<string, RowAmounts>>(
    () => ({}),
  )
  const [selectionReady, setSelectionReady] = useState(false)

  useEffect(() => {
    if (selectionReady) return
    const draft = getContractualDistributionDraft()
    const allIds = candidates.map((c) => c.id)
    const initialAmounts: Record<string, RowAmounts> = {}

    for (const employee of candidates) {
      initialAmounts[employee.id] = amountsFromAssignments(
        draft?.assignmentsByEmployeeId[employee.id],
      )
    }

    if (draft && draft.selectedEmployeeIds.length > 0) {
      const valid = new Set(allIds)
      setSelectedIds(
        new Set(draft.selectedEmployeeIds.filter((id) => valid.has(id))),
      )
      setGroupFilter((draft.groupFilter as GroupFilter) || 'ALL')
    } else {
      setSelectedIds(new Set(allIds))
    }

    setAmountsById(initialAmounts)
    setSelectionReady(true)
  }, [candidates, selectionReady])

  const groupOptions = useMemo(() => {
    const groups = Array.from(
      new Set(candidates.map((c) => c.groupLabel)),
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
        c.name.toLowerCase().includes(query) ||
        c.employeeNumber.toLowerCase().includes(query)
      const matchesGroup = groupFilter === 'ALL' || c.groupLabel === groupFilter
      return matchesSearch && matchesGroup
    })
  }, [candidates, search, groupFilter])

  const filterResetKey = [search, groupFilter].join('|')
  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(filteredCandidates, pageSize, filterResetKey)

  const filteredIds = filteredCandidates.map((c) => c.id)
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

  const checkedEmployees = candidates.filter((e) => selectedIds.has(e.id))
  const canContinue =
    checkedEmployees.length > 0 &&
    checkedEmployees.every((e) =>
      rowHasValidCredit(amountsById[e.id] ?? { vlToAdd: '', slToAdd: '' }),
    )

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

  function updateAmount(
    employeeId: string,
    field: keyof RowAmounts,
    value: string,
  ) {
    setAmountsById((prev) => ({
      ...prev,
      [employeeId]: {
        ...(prev[employeeId] ?? { vlToAdd: '', slToAdd: '' }),
        [field]: value,
      },
    }))
  }

  function handleContinue() {
    if (!canContinue) return
    const existingDraft = getContractualDistributionDraft()
    const selectedEmployeeIds = Array.from(selectedIds)
    const assignmentsByEmployeeId: Record<string, ContractualAssignment[]> = {}
    for (const id of selectedEmployeeIds) {
      assignmentsByEmployeeId[id] = buildAssignments(
        amountsById[id] ?? { vlToAdd: '', slToAdd: '' },
      )
    }
    setContractualDistributionDraft({
      selectedEmployeeIds,
      assignmentsByEmployeeId,
      groupFilter,
      effectiveDate:
        existingDraft?.effectiveDate || CONTRACTUAL_EFFECTIVE_DATE,
    })
    navigate(distributionReviewPath('contractual'))
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
        Assign contractual leave credits
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
                  className="w-full rounded-md border border-border bg-surface py-1.5 pr-3 pl-9 text-small text-text-black outline-none placeholder:text-text-gray focus:border-primary focus:ring-2 focus:ring-primary/20"
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
            <table className="w-full min-w-[1020px] table-fixed text-left">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[10%]" />
                <col className="w-[18%]" />
                <col className="w-[9%]" />
                <col className="w-[11%]" />
                <col className="w-[14%]" />
                <col className="w-[11%]" />
                <col className="w-[22%]" />
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
                      aria-label="Select all filtered contractual employees"
                      className="size-4 accent-primary disabled:cursor-not-allowed"
                    />
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wide">
                    Employee No.
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wide">
                    Employee Name
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wide">
                    Group
                  </th>
                  <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                    Current VL
                  </th>
                  <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                    VL to Add
                  </th>
                  <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                    Current SL
                  </th>
                  <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                    SL to Add
                  </th>
                </tr>
              </thead>
              <tbody>
                {showSkeleton || !selectionReady ? (
                  <TableBodySkeleton
                    rows={pageSize}
                    cols={8}
                    rowClassName={APPROVALS_TABLE_ROW_HEIGHT_CLASS}
                  />
                ) : paginatedItems.length === 0 ? (
                  <tr className={APPROVALS_TABLE_ROW_HEIGHT_CLASS}>
                    <td
                      colSpan={8}
                      className="px-5 text-center text-body text-text-gray"
                    >
                      No employees match the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((employee) => (
                    <AssignRow
                      key={employee.id}
                      employee={employee}
                      checked={selectedIds.has(employee.id)}
                      onToggle={() => toggleId(employee.id)}
                      amounts={
                        amountsById[employee.id] ?? { vlToAdd: '', slToAdd: '' }
                      }
                      onChange={(field, value) =>
                        updateAmount(employee.id, field, value)
                      }
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

function AssignRow({
  employee,
  checked,
  onToggle,
  amounts,
  onChange,
}: {
  employee: LeaveBalanceEmployee
  checked: boolean
  onToggle: () => void
  amounts: RowAmounts
  onChange: (field: keyof RowAmounts, value: string) => void
}) {
  return (
    <tr
      className={`${APPROVALS_TABLE_ROW_HEIGHT_CLASS} border-b border-border last:border-b-0`}
    >
      <td className="px-3 text-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Include ${employee.name}`}
          className="size-4 accent-primary"
        />
      </td>
      <td className="px-4 text-body text-text-black">
        {employee.employeeNumber}
      </td>
      <td
        className="truncate px-4 text-body text-text-black"
        title={employee.name}
      >
        {employee.name}
      </td>
      <td className="px-4 text-body text-text-black">{employee.groupLabel}</td>
      <td className="px-3 text-center text-body text-text-black">
        {formatBalanceValue(employee.balances.vl)}
      </td>
      <td className="px-3 text-center">
        <input
          type="number"
          min={0}
          step={0.5}
          value={amounts.vlToAdd}
          onChange={(e) => onChange('vlToAdd', e.target.value)}
          disabled={!checked}
          aria-label={`VL to add for ${employee.name}`}
          className="mx-auto w-24 rounded-md border border-border bg-surface px-2 py-1 text-center text-body text-text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </td>
      <td className="px-3 text-center text-body text-text-black">
        {formatBalanceValue(employee.balances.sl)}
      </td>
      <td className="px-3 text-center">
        <input
          type="number"
          min={0}
          step={0.5}
          value={amounts.slToAdd}
          onChange={(e) => onChange('slToAdd', e.target.value)}
          disabled={!checked}
          aria-label={`SL to add for ${employee.name}`}
          className="mx-auto w-24 rounded-md border border-border bg-surface px-2 py-1 text-center text-body text-text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </td>
    </tr>
  )
}
