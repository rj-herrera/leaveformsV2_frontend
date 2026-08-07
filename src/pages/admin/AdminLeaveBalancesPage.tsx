import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowDown, ArrowUp } from 'lucide-react'
import { EmploymentStatusPill } from '../../components/admin/EmploymentStatusPill'
import { AdjustCreditsModal } from '../../components/admin/AdjustCreditsModal'
import { LeaveTypeChipHeader } from '../../components/admin/LeaveTypeChipHeader'
import {
  SelectDistributionModal,
  type DistributionType,
} from '../../components/admin/SelectDistributionModal'
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
import { TABLE_BODY_ROW_BORDER_CLASS } from '../../components/ui/tableStyles'
import { useContentSizedTablePageSize } from '../../hooks/useContentSizedTablePageSize'
import {
  APPROVALS_TABLE_ROW_HEIGHT,
  APPROVALS_TABLE_ROW_HEIGHT_CLASS,
} from '../../hooks/usePageSizeFromHeight'
import { usePagination } from '../../hooks/usePagination'
import { shouldShowDataSkeleton } from '../../mocks/config'
import {
  EMPLOYMENT_STATUS_LABELS,
  LEAVE_BALANCE_KEYS,
  type EmploymentStatus,
  filterLeaveBalanceRows,
  formatBalanceValue,
  getAdminLeaveBalanceRows,
  getLeaveBalanceDepartments,
  getLeaveBalanceEmployeeById,
  getLeaveBalanceGroups,
} from '../../mocks/leaveBalances'
import { distributionEmployeesPath } from '../../utils/distributionPaths'

type DepartmentFilter = 'ALL' | string
type GroupFilter = 'ALL' | string
type EmploymentStatusFilter = 'ALL' | EmploymentStatus
type EmployeeNumberSort = 'asc' | 'desc'

function compareEmployeeNumber(a: string, b: string): number {
  const numA = Number(a)
  const numB = Number(b)
  if (Number.isFinite(numA) && Number.isFinite(numB)) {
    return numA - numB
  }
  return a.localeCompare(b)
}

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
  'For corrections and exceptions only. Use Distribute Leave Credits for routine grants.'

export function AdminLeaveBalancesPage() {
  const navigate = useNavigate()
  const availableSlotRef = useRef<HTMLDivElement>(null)
  const sectionHeaderRef = useRef<HTMLDivElement>(null)
  const paginationRef = useRef<HTMLDivElement>(null)
  const tableAreaRef = useRef<HTMLDivElement>(null)
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

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] =
    useState<DepartmentFilter>('ALL')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [employmentStatusFilter, setEmploymentStatusFilter] =
    useState<EmploymentStatusFilter>('ALL')
  const [employeeNumberSort, setEmployeeNumberSort] =
    useState<EmployeeNumberSort>('asc')
  const [distributeOpen, setDistributeOpen] = useState(false)
  const [adjustEmployeeId, setAdjustEmployeeId] = useState<string | null>(null)
  const [listVersion, setListVersion] = useState(0)

  const allRows = useMemo(() => {
    void listVersion
    return getAdminLeaveBalanceRows()
  }, [listVersion])

  const adjustEmployee = useMemo(() => {
    if (!adjustEmployeeId) return null
    return getLeaveBalanceEmployeeById(adjustEmployeeId)
  }, [adjustEmployeeId, listVersion])

  const departmentOptions = useMemo(() => {
    return [
      { value: 'ALL' as const, label: 'All Departments' },
      ...getLeaveBalanceDepartments().map((department) => ({
        value: department,
        label: department,
      })),
    ]
  }, [])

  const groupOptions = useMemo(() => {
    return [
      { value: 'ALL' as const, label: 'All Groups' },
      ...getLeaveBalanceGroups().map((group) => ({
        value: group,
        label: group,
      })),
    ]
  }, [])

  const filteredRows = useMemo(
    () =>
      filterLeaveBalanceRows(allRows, {
        search,
        department: departmentFilter,
        group: groupFilter,
        employmentStatus: employmentStatusFilter,
      }),
    [allRows, search, departmentFilter, groupFilter, employmentStatusFilter],
  )

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const cmp = compareEmployeeNumber(a.employeeNumber, b.employeeNumber)
      return employeeNumberSort === 'asc' ? cmp : -cmp
    })
  }, [filteredRows, employeeNumberSort])

  const filterResetKey = [
    search,
    departmentFilter,
    groupFilter,
    employmentStatusFilter,
    employeeNumberSort,
  ].join('|')
  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(sortedRows, pageSize, filterResetKey)

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
                  className="h-[2.125rem] w-full rounded-md border border-border bg-surface pr-3 pl-9 text-small text-text-black outline-none placeholder:text-text-gray focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <FilterSelect
                  label="Filter by department"
                  value={departmentFilter}
                  onChange={setDepartmentFilter}
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
                ) : paginatedItems.length === 0 ? (
                  <tr className={APPROVALS_TABLE_ROW_HEIGHT_CLASS}>
                    <td
                      colSpan={11}
                      className="px-5 text-center text-body text-text-gray"
                    >
                      No employees match the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((row) => (
                    <tr
                      key={row.id}
                      className={`${APPROVALS_TABLE_ROW_HEIGHT_CLASS} ${TABLE_BODY_ROW_BORDER_CLASS}`}
                    >
                      <td className="px-5 text-body text-text-black">
                        {row.employeeNumber}
                      </td>
                      <td
                        className="truncate px-5 text-body text-text-black"
                        title={row.name}
                      >
                        {row.name}
                      </td>
                      <td className="px-5 text-body text-text-black">
                        {row.groupLabel}
                      </td>
                      <td className="px-5">
                        <EmploymentStatusPill status={row.employmentStatus} />
                      </td>
                      {LEAVE_BALANCE_KEYS.map((key) => (
                        <td
                          key={key}
                          className="px-3 text-center text-body text-text-black"
                        >
                          {formatBalanceValue(row.balances[key])}
                        </td>
                      ))}
                      <td className="px-5 text-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          title={ADJUST_TOOLTIP}
                          onClick={() => setAdjustEmployeeId(row.id)}
                        >
                          Adjust
                        </Button>
                      </td>
                    </tr>
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
                totalItems={sortedRows.length}
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
        onSuccess={() => setListVersion((v) => v + 1)}
      />
    </div>
  )
}
