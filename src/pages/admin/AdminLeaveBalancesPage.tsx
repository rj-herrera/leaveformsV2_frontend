import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowDown, ArrowUp } from 'lucide-react'
import { AdjustCreditsModal } from '../../components/admin/AdjustCreditsModal'
import { EmploymentStatusPill } from '../../components/admin/EmploymentStatusPill'
import { LeaveTypeChipHeader } from '../../components/admin/LeaveTypeChipHeader'
import {
  SelectDistributionModal,
  type DistributionType,
} from '../../components/admin/SelectDistributionModal'
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
import type { EmploymentStatusApi } from '../../api/types'
import { useAdminBalances } from '../../hooks/api/useAdminBalances'
import { useAdminDepartments } from '../../hooks/api/useAdminDepartments'
import { useAdminGroups } from '../../hooks/api/useAdminGroups'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import {
  EMPLOYMENT_STATUS_LABELS,
  LEAVE_BALANCE_KEYS,
  type EmploymentStatus,
} from '../../mocks/leaveBalances'
import { formatAdminBalanceAvailable } from '../../utils/adminBalances'
import { distributionEmployeesPath } from '../../utils/distributionPaths'

type DepartmentFilter = 'ALL' | string
type GroupFilter = 'ALL' | string
type EmploymentStatusFilter = 'ALL' | EmploymentStatus
type EmployeeNumberSort = 'asc' | 'desc'

const PAGE_SIZE_DEBOUNCE_MS = 150
const SEARCH_DEBOUNCE_MS = 300

const EMPLOYMENT_STATUS_OPTIONS: Array<{
  value: EmploymentStatusFilter
  label: string
}> = [
  { value: 'ALL', label: 'All Employment Statuses' },
  ...(Object.entries(EMPLOYMENT_STATUS_LABELS) as Array<
    [EmploymentStatus, string]
  >).map(([value, label]) => ({ value, label })),
]

const ADJUST_TOOLTIP =
  'Use only for corrections and exceptions.'

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])

  return debounced
}

export function AdminLeaveBalancesPage() {
  const navigate = useNavigate()
  const {
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
    pageSize: measuredPageSize,
  } = useContentSizedTableRefs({ fallbackRowHeight: APPROVALS_TABLE_ROW_HEIGHT })
  const pageSize = useDebouncedValue(measuredPageSize, PAGE_SIZE_DEBOUNCE_MS)
  const prevPageSizeRef = useRef<number | null>(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)
  const [departmentFilter, setDepartmentFilter] =
    useState<DepartmentFilter>('ALL')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [employmentStatusFilter, setEmploymentStatusFilter] =
    useState<EmploymentStatusFilter>('ALL')
  const [employeeNumberSort, setEmployeeNumberSort] =
    useState<EmployeeNumberSort>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [distributeOpen, setDistributeOpen] = useState(false)
  const [adjustEmployeeId, setAdjustEmployeeId] = useState<number | null>(null)
  const [awaitingListReset, setAwaitingListReset] = useState(false)
  const skipListResetSkeleton = useRef(true)

  const { data: adminDepartments } = useAdminDepartments()
  const { data: adminGroups } = useAdminGroups()

  const departmentId =
    departmentFilter !== 'ALL' ? Number(departmentFilter) : undefined
  const groupId = groupFilter !== 'ALL' ? Number(groupFilter) : undefined

  const listParams = useMemo(
    () => ({
      q: debouncedSearch.length > 0 ? debouncedSearch : undefined,
      department_id:
        departmentId != null &&
        Number.isInteger(departmentId) &&
        departmentId > 0
          ? departmentId
          : undefined,
      group_id:
        groupId != null && Number.isInteger(groupId) && groupId > 0
          ? groupId
          : undefined,
      employment_status:
        employmentStatusFilter === 'ALL'
          ? undefined
          : (employmentStatusFilter as EmploymentStatusApi),
      sort: employeeNumberSort,
      page: currentPage,
      per_page: pageSize,
    }),
    [
      debouncedSearch,
      departmentId,
      groupId,
      employmentStatusFilter,
      employeeNumberSort,
      currentPage,
      pageSize,
    ],
  )

  const { data, error, isLoading, isValidating, mutate } =
    useAdminBalances(listParams)

  const adjustEmployee = useMemo(() => {
    if (adjustEmployeeId == null) return null
    return (
      data?.data.find((row) => row.employee.id === adjustEmployeeId) ?? null
    )
  }, [adjustEmployeeId, data])

  useEffect(() => {
    setCurrentPage(1)
    if (skipListResetSkeleton.current) {
      skipListResetSkeleton.current = false
      return
    }
    setAwaitingListReset(true)
  }, [
    debouncedSearch,
    departmentFilter,
    groupFilter,
    employmentStatusFilter,
    employeeNumberSort,
  ])

  useEffect(() => {
    const previous = prevPageSizeRef.current
    prevPageSizeRef.current = pageSize
    if (previous == null || previous === pageSize) return

    setCurrentPage((page) => {
      const firstVisibleIndex = (page - 1) * previous
      return Math.max(1, Math.floor(firstVisibleIndex / pageSize) + 1)
    })
  }, [pageSize])

  useEffect(() => {
    if (!awaitingListReset) return
    if (!isValidating) {
      setAwaitingListReset(false)
    }
  }, [awaitingListReset, isValidating, data, error])

  const rows = awaitingListReset ? [] : (data?.data ?? [])
  const totalItems = awaitingListReset ? 0 : (data?.meta?.total ?? 0)
  const totalPages = awaitingListReset
    ? 1
    : Math.max(1, data?.meta?.last_page ?? 1)

  useEffect(() => {
    if (awaitingListReset) return
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [awaitingListReset, currentPage, totalPages])

  const departmentOptions = useMemo(
    () => [
      { value: 'ALL' as const, label: 'All Departments' },
      ...(adminDepartments ?? []).map((department) => ({
        value: String(department.id),
        label: department.abbreviation ?? department.name ?? String(department.id),
      })),
    ],
    [adminDepartments],
  )

  const groupOptions = useMemo(() => {
    const groups = adminGroups ?? []
    const filtered =
      departmentFilter === 'ALL'
        ? groups
        : groups.filter((group) => String(group.dept_id) === departmentFilter)

    return [
      { value: 'ALL' as const, label: 'All Groups' },
      ...filtered.map((group) => ({
        value: String(group.id),
        label: group.abbreviation ?? group.name ?? String(group.id),
      })),
    ]
  }, [adminGroups, departmentFilter])

  function handleDepartmentChange(value: DepartmentFilter) {
    setDepartmentFilter(value)
    if (value === 'ALL' || groupFilter === 'ALL') return
    const selected = adminGroups?.find((group) => String(group.id) === groupFilter)
    if (selected && String(selected.dept_id) !== value) {
      setGroupFilter('ALL')
    }
  }

  const showSkeleton = (isLoading && !data) || awaitingListReset
  const hasActiveFilters =
    search.trim().length > 0 ||
    departmentFilter !== 'ALL' ||
    groupFilter !== 'ALL' ||
    employmentStatusFilter !== 'ALL'

  function clearFilters() {
    setSearch('')
    setDepartmentFilter('ALL')
    setGroupFilter('ALL')
    setEmploymentStatusFilter('ALL')
  }

  function handleDistributeContinue(type: DistributionType) {
    navigate(distributionEmployeesPath(type))
  }

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h1 className="text-h1 text-text-black">Leave Balances</h1>
        </div>
        <Button variant="primary" onClick={() => setDistributeOpen(true)}>
          Distribute Leave Credits
        </Button>
      </div>

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
                  label="Filter by department"
                  value={departmentFilter}
                  onChange={handleDepartmentChange}
                  options={departmentOptions}
                  selectHeight="h-[2.125rem]"
                />
                <FilterSelect
                  label="Filter by group"
                  value={groupFilter}
                  onChange={setGroupFilter}
                  options={groupOptions}
                  selectHeight="h-[2.125rem]"
                />
                <FilterSelect
                  label="Filter by employment status"
                  value={employmentStatusFilter}
                  onChange={setEmploymentStatusFilter}
                  options={EMPLOYMENT_STATUS_OPTIONS}
                  selectHeight="h-[2.125rem]"
                />
              </div>
            </div>
          </div>

          <div ref={tableAreaRef} className={TABLE_CONTENT_AREA}>
            <table className="w-full min-w-[960px] table-fixed text-left">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[8%]" />
                <col className="w-[14%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="h-11 border-b border-border bg-surface-muted text-small text-text-gray">
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    <div className="flex items-center gap-1.5">
                      <span>Employee No.</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEmployeeNumberSort((sort) =>
                            sort === 'asc' ? 'desc' : 'asc',
                          )
                        }
                        className="inline-flex rounded p-0.5 text-text-gray transition-colors hover:bg-background hover:text-text-black"
                        aria-label={`Sort employee number ${employeeNumberSort === 'asc' ? 'descending' : 'ascending'}`}
                      >
                        {employeeNumberSort === 'asc' ? (
                          <ArrowUp className="size-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="size-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Employee Name
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Group
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wide">
                    Employment Status
                  </th>
                  {LEAVE_BALANCE_KEYS.map((key) => (
                    <th
                      key={key}
                      className="px-3 py-3 text-center font-bold uppercase tracking-wide"
                    >
                      <LeaveTypeChipHeader balanceKey={key} />
                    </th>
                  ))}
                  <th className="px-5 py-3 text-center font-bold uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {showSkeleton ? (
                  <TableBodySkeleton
                    rows={pageSize}
                    cols={11}
                    rowClassName={APPROVALS_TABLE_ROW_HEIGHT_CLASS}
                  />
                ) : error && !data ? (
                  <TableEmptyRow
                    colSpan={11}
                    pageSize={pageSize}
                    rowHeight={APPROVALS_TABLE_ROW_HEIGHT}
                    variant="no-data"
                    message="Unable to load leave balances. Please try again."
                  />
                ) : rows.length === 0 ? (
                  <TableEmptyRow
                    colSpan={11}
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
                  rows.map((row) => {
                    const emp = row.employee
                    const groupLabel =
                      emp.group?.abbreviation ?? emp.group?.name ?? '—'
                    return (
                      <tr
                        key={emp.id}
                        className={`${APPROVALS_TABLE_ROW_HEIGHT_CLASS} ${TABLE_BODY_ROW_BORDER_CLASS}`}
                      >
                        <td className="px-5 text-body text-text-black">
                          {emp.employee_number}
                        </td>
                        <td
                          className="truncate px-5 text-body text-text-black"
                          title={emp.name ?? undefined}
                        >
                          {emp.name ?? '—'}
                        </td>
                        <td className="px-5 text-body text-text-black">
                          {groupLabel}
                        </td>
                        <td className="px-5">
                          <EmploymentStatusPill
                            status={row.employment_status}
                          />
                        </td>
                        {LEAVE_BALANCE_KEYS.map((key) => (
                          <td
                            key={key}
                            className="px-3 text-center text-body text-text-black"
                          >
                            {formatAdminBalanceAvailable(row.balances, key)}
                          </td>
                        ))}
                        <td className="px-5 text-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            title={ADJUST_TOOLTIP}
                            onClick={() => setAdjustEmployeeId(emp.id)}
                          >
                            Adjust
                          </Button>
                        </td>
                      </tr>
                    )
                  })
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

      <SelectDistributionModal
        open={distributeOpen}
        onClose={() => setDistributeOpen(false)}
        onContinue={handleDistributeContinue}
      />

      <AdjustCreditsModal
        open={adjustEmployeeId != null}
        employee={adjustEmployee}
        onClose={() => setAdjustEmployeeId(null)}
        onSuccess={() => {
          void mutate()
        }}
      />
    </div>
  )
}
