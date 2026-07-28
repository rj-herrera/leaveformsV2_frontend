import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { EmploymentStatusPill } from '../../components/admin/EmploymentStatusPill'
import { LeaveTypeChipHeader } from '../../components/admin/LeaveTypeChipHeader'
import {
  SelectDistributionModal,
  type DistributionType,
} from '../../components/admin/SelectDistributionModal'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { Modal } from '../../components/ui/Modal'
import { Pagination } from '../../components/ui/Pagination'
import { TableBodySkeleton } from '../../components/ui/Skeleton'
import { TABLE_ACTION_BUTTON_CLASS } from '../../components/ui/tableStyles'
import {
  APPROVALS_TABLE_ROW_HEIGHT,
  APPROVALS_TABLE_ROW_HEIGHT_CLASS,
  usePageSizeFromHeight,
} from '../../hooks/usePageSizeFromHeight'
import { usePagination } from '../../hooks/usePagination'
import { shouldShowDataSkeleton } from '../../mocks/config'
import {
  LEAVE_BALANCE_KEYS,
  filterLeaveBalanceRows,
  formatBalanceValue,
  getAdminLeaveBalanceRows,
  getLeaveBalanceDepartments,
  getLeaveBalanceGroups,
  type LeaveBalanceEmployee,
} from '../../mocks/leaveBalances'
import { distributionEmployeesPath } from '../../utils/distributionPaths'

type DepartmentFilter = 'ALL' | string
type GroupFilter = 'ALL' | string

const ADJUST_TOOLTIP =
  'For corrections and exceptions only. Use Distribute Leave Credits for routine grants.'

export function AdminLeaveBalancesPage() {
  const navigate = useNavigate()
  const tableAreaRef = useRef<HTMLDivElement>(null)
  const pageSize = usePageSizeFromHeight(
    tableAreaRef,
    APPROVALS_TABLE_ROW_HEIGHT,
  )
  const showSkeleton = shouldShowDataSkeleton()

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] =
    useState<DepartmentFilter>('ALL')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [distributeOpen, setDistributeOpen] = useState(false)
  const [adjustEmployee, setAdjustEmployee] =
    useState<LeaveBalanceEmployee | null>(null)

  const allRows = useMemo(() => getAdminLeaveBalanceRows(), [])

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
      }),
    [allRows, search, departmentFilter, groupFilter],
  )

  const filterResetKey = [search, departmentFilter, groupFilter].join('|')
  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(filteredRows, pageSize, filterResetKey)

  function handleDistributeContinue(type: DistributionType) {
    navigate(distributionEmployeesPath(type))
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h1 className="text-h1 text-text-black">Leave Balances</h1>
        </div>
        <button
          type="button"
          onClick={() => setDistributeOpen(true)}
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2.5 text-body font-medium text-white transition-opacity hover:opacity-90"
        >
          Distribute Leave Credits
        </button>
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex shrink-0 flex-col gap-3 border-b border-border px-5 py-4">
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
                label="Filter by department"
                value={departmentFilter}
                onChange={setDepartmentFilter}
                options={departmentOptions}
              />
              <FilterSelect
                label="Filter by group"
                value={groupFilter}
                onChange={setGroupFilter}
                options={groupOptions}
              />
            </div>
          </div>
        </div>

        <div
          ref={tableAreaRef}
          className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-1"
        >
          <table className="w-full min-w-[960px] table-fixed text-left">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[12%]" />
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
                  Employee Name
                </th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">
                  Employee Number
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
                    className={`${APPROVALS_TABLE_ROW_HEIGHT_CLASS} border-b border-border last:border-b-0`}
                  >
                    <td
                      className="truncate px-5 text-body text-text-black"
                      title={row.name}
                    >
                      {row.name}
                    </td>
                    <td className="px-5 text-body text-text-black">
                      {row.employeeNumber}
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
                      <button
                        type="button"
                        title={ADJUST_TOOLTIP}
                        onClick={() => setAdjustEmployee(row)}
                        className={TABLE_ACTION_BUTTON_CLASS}
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRows.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </section>

      <SelectDistributionModal
        open={distributeOpen}
        onClose={() => setDistributeOpen(false)}
        onContinue={handleDistributeContinue}
      />

      <Modal
        open={adjustEmployee != null}
        onClose={() => setAdjustEmployee(null)}
        title="Adjust leave credits"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setAdjustEmployee(null)}
              className="rounded-md bg-primary px-4 py-2.5 text-body font-medium text-white transition-opacity hover:opacity-90"
            >
              Close
            </button>
          </div>
        }
      >
        <p className="text-body text-text-black">
          Adjust for{' '}
          <span className="font-semibold">{adjustEmployee?.name}</span> (
          {adjustEmployee?.employeeNumber}) will be available in a later update.
        </p>
        <p className="mt-2 text-small text-text-gray">{ADJUST_TOOLTIP}</p>
      </Modal>
    </div>
  )
}
