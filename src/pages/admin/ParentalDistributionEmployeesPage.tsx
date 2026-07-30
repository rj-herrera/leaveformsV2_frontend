import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Search } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { FilterSelect } from '../../components/ui/FilterSelect'
import { Modal } from '../../components/ui/Modal'
import { Pagination } from '../../components/ui/Pagination'
import { TableBodySkeleton } from '../../components/ui/Skeleton'
import {
  APPROVALS_TABLE_ROW_HEIGHT,
  APPROVALS_TABLE_ROW_HEIGHT_CLASS,
  usePageSizeFromHeight,
} from '../../hooks/usePageSizeFromHeight'
import { usePagination } from '../../hooks/usePagination'
import { shouldShowDataSkeleton } from '../../mocks/config'
import {
  formatDisplayDate,
  formatParentalFiledByLabel,
  getParentalDistributionCandidates,
  getParentalDistributionDraft,
  parentalCandidateKey,
  setParentalDistributionDraft,
  type ParentalCandidate,
} from '../../mocks/leaveBalances'
import {
  distributionReviewPath,
  leaveBalancesLandingPath,
} from '../../utils/distributionPaths'

type GroupFilter = 'ALL' | string

const PARENTAL_EFFECTIVE_DATE = '2026-07-28'

export function ParentalDistributionEmployeesPage() {
  const navigate = useNavigate()
  const tableAreaRef = useRef<HTMLDivElement>(null)
  const headerCheckboxRef = useRef<HTMLInputElement>(null)
  const pageSize = usePageSizeFromHeight(
    tableAreaRef,
    APPROVALS_TABLE_ROW_HEIGHT,
  )
  const showSkeleton = shouldShowDataSkeleton()

  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set())
  const [selectionReady, setSelectionReady] = useState(false)
  const [detailsCandidate, setDetailsCandidate] =
    useState<ParentalCandidate | null>(null)

  /** One row per filed ML/PL request. */
  const candidates = useMemo(() => getParentalDistributionCandidates(), [])

  useEffect(() => {
    if (selectionReady) return
    const draft = getParentalDistributionDraft()
    const allKeys = new Set(
      candidates.map((c) => parentalCandidateKey(c.employee.id, c.leaveType)),
    )
    if (draft && draft.selectedKeys.length > 0) {
      setSelectedKeys(
        new Set(draft.selectedKeys.filter((key) => allKeys.has(key))),
      )
      setGroupFilter((draft.groupFilter as GroupFilter) || 'ALL')
    } else {
      setSelectedKeys(new Set(allKeys))
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
        c.employee.employeeNumber.toLowerCase().includes(query) ||
        c.leaveType.toLowerCase().includes(query)
      const matchesGroup =
        groupFilter === 'ALL' || c.employee.groupLabel === groupFilter
      return matchesSearch && matchesGroup
    })
  }, [candidates, search, groupFilter])

  const filterResetKey = [search, groupFilter].join('|')
  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(filteredCandidates, pageSize, filterResetKey)

  const filteredKeys = filteredCandidates.map((c) =>
    parentalCandidateKey(c.employee.id, c.leaveType),
  )
  const selectedInFilterCount = filteredKeys.filter((key) =>
    selectedKeys.has(key),
  ).length
  const allFilteredSelected =
    filteredKeys.length > 0 && selectedInFilterCount === filteredKeys.length
  const someFilteredSelected =
    selectedInFilterCount > 0 && selectedInFilterCount < filteredKeys.length

  useEffect(() => {
    const el = headerCheckboxRef.current
    if (el) el.indeterminate = someFilteredSelected
  }, [someFilteredSelected])

  const canContinue = selectedKeys.size > 0

  function toggleKey(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleSelectAllFiltered() {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        for (const key of filteredKeys) next.delete(key)
      } else {
        for (const key of filteredKeys) next.add(key)
      }
      return next
    })
  }

  function handleContinue() {
    if (!canContinue) return
    setParentalDistributionDraft({
      selectedKeys: Array.from(selectedKeys),
      groupFilter,
      effectiveDate: PARENTAL_EFFECTIVE_DATE,
    })
    navigate(distributionReviewPath('parental'))
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <Link
        to={leaveBalancesLandingPath()}
        className="text-body inline-flex w-fit shrink-0 items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Leave Balances
      </Link>

      <h1 className="shrink-0 text-h1 text-text-black">
        Select maternity / paternity recipients
      </h1>

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
          <table className="w-full min-w-[1020px] table-fixed text-left">
            <colgroup>
              <col className="w-[5%]" />
              <col className="w-[17%]" />
              <col className="w-[12%]" />
              <col className="w-[8%]" />
              <col className="w-[16%]" />
              <col className="w-[12%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead>
              <tr className="h-11 border-b border-border bg-surface-muted text-small text-text-gray">
                <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allFilteredSelected}
                    disabled={filteredKeys.length === 0}
                    onChange={toggleSelectAllFiltered}
                    aria-label="Select all recipients"
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
                  Leave Type
                </th>
                <th className="px-3 py-3 font-bold uppercase tracking-wide">
                  Date Filed
                </th>
                <th className="px-3 py-3 font-bold uppercase tracking-wide">
                  Leave Period
                </th>
                <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                  Attachment
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
                paginatedItems.map((row) => {
                  const key = parentalCandidateKey(
                    row.employee.id,
                    row.leaveType,
                  )
                  return (
                    <CandidateRow
                      key={key}
                      candidate={row}
                      checked={selectedKeys.has(key)}
                      onToggle={() => toggleKey(key)}
                      onViewDetails={() => setDetailsCandidate(row)}
                    />
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCandidates.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </section>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <Link
          to={leaveBalancesLandingPath()}
          className="rounded-md border border-border bg-surface px-4 py-2.5 text-body font-medium text-text-black transition-colors hover:bg-surface-muted"
        >
          Back
        </Link>
        <Button
          type="button"
          variant="primary"
          disabled={!canContinue}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>

      <ParentalRequestDetailsModal
        candidate={detailsCandidate}
        onClose={() => setDetailsCandidate(null)}
      />
    </div>
  )
}

function CandidateRow({
  candidate,
  checked,
  onToggle,
  onViewDetails,
}: {
  candidate: ParentalCandidate
  checked: boolean
  onToggle: () => void
  onViewDetails: () => void
}) {
  const { employee, leaveType, dateFiled, leavePeriod } = candidate

  return (
    <tr
      className={`${APPROVALS_TABLE_ROW_HEIGHT_CLASS} border-b border-border last:border-b-0`}
    >
      <td className="px-3 text-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Select ${employee.name} for ${leaveType}`}
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
      <td className="truncate px-3 text-body text-text-black" title={leaveType}>
        {leaveType}
      </td>
      <td className="px-3 text-body text-text-black">
        {formatDisplayDate(dateFiled)}
      </td>
      <td
        className="truncate px-3 text-body text-text-black"
        title={leavePeriod}
      >
        {leavePeriod}
      </td>
      <td className="px-3 text-center">
        <Button type="button" size="sm" onClick={onViewDetails}>
          View Details
        </Button>
      </td>
    </tr>
  )
}

function ParentalRequestDetailsModal({
  candidate,
  onClose,
}: {
  candidate: ParentalCandidate | null
  onClose: () => void
}) {
  const open = candidate != null
  const attachmentFileName = candidate?.attachmentFileName ?? null
  const showFiledBy = candidate?.filedByRole === 'leader'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attachment"
      maxWidthClass="max-w-3xl"
      footer={
        <Button type="button" onClick={onClose}>
          Close
        </Button>
      }
    >
      {candidate ? (
        <div className="space-y-4">
          <dl className="space-y-2.5">
            <InfoRow label="Employee" value={candidate.employee.name} />
            {showFiledBy ? (
              <InfoRow
                label="Filed by"
                value={formatParentalFiledByLabel(candidate)}
              />
            ) : null}
          </dl>

          {attachmentFileName ? (
            <div>
              <p className="mb-3 text-small text-text-gray">
                {attachmentFileName}
              </p>
              <div className="flex min-h-[320px] items-center justify-center rounded-md border border-border bg-surface-muted p-4">
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className="flex size-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-7" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-body font-semibold text-text-black">
                      {attachmentFileName}
                    </p>
                    <p className="mt-1 text-small text-text-gray">
                      Preview placeholder — file content will load from the API
                      later.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-2 sm:grid-cols-[9.5rem_1fr]">
      <dt className="text-small text-text-gray">{label}</dt>
      <dd className="text-body text-text-black">{value}</dd>
    </div>
  )
}
