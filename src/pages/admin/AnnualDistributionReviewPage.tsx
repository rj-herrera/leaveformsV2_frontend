import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { Pagination } from '../../components/ui/Pagination'
import { TableBodySkeleton } from '../../components/ui/Skeleton'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import {
  APPROVALS_TABLE_ROW_HEIGHT,
  APPROVALS_TABLE_ROW_HEIGHT_CLASS,
  usePageSizeFromHeight,
} from '../../hooks/usePageSizeFromHeight'
import { usePagination } from '../../hooks/usePagination'
import { shouldShowDataSkeleton } from '../../mocks/config'
import {
  applyAnnualDistribution,
  formatBalanceValue,
  getAnnualDistributionDraft,
  getAnnualReviewRows,
} from '../../mocks/leaveBalances'
import {
  distributionEmployeesPath,
  leaveBalancesLandingPath,
} from '../../utils/distributionPaths'

function formatEffectiveDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function AnnualDistributionReviewPage() {
  const navigate = useNavigate()
  const tableAreaRef = useRef<HTMLDivElement>(null)
  const pageSize = usePageSizeFromHeight(
    tableAreaRef,
    APPROVALS_TABLE_ROW_HEIGHT,
  )
  const showSkeleton = shouldShowDataSkeleton()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  const draft = useMemo(() => getAnnualDistributionDraft(), [])
  const reviewRows = useMemo(
    () =>
      draft ? getAnnualReviewRows(draft.selectedEmployeeIds) : [],
    [draft],
  )

  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(reviewRows, pageSize, 'annual-review')

  useEffect(() => {
    if (!draft || draft.selectedEmployeeIds.length === 0) {
      navigate(distributionEmployeesPath('annual'), { replace: true })
    }
  }, [draft, navigate])

  if (!draft || draft.selectedEmployeeIds.length === 0) {
    return <Navigate to={distributionEmployeesPath('annual')} replace />
  }

  function handleConfirmApply() {
    applyAnnualDistribution(draft!.selectedEmployeeIds)
    setConfirmOpen(false)
    setSuccessOpen(true)
  }

  function handleSuccessClose() {
    setSuccessOpen(false)
    navigate(leaveBalancesLandingPath())
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <Link
        to={distributionEmployeesPath('annual')}
        className="text-body inline-flex w-fit shrink-0 items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to select employees
      </Link>

      <h1 className="shrink-0 text-h1 text-text-black">
        Review & confirm distribution
      </h1>

      <section className="shrink-0 rounded-lg border border-border bg-surface px-5 py-4">
        <h2 className="text-h2 text-text-black">Distribution Summary</h2>
        <dl className="mt-3 grid gap-3 grid-cols-3">
          <SummaryItem label="Type" value="Annual Leave Credit Distribution" />
          <SummaryItem
            label="Effective date"
            value={formatEffectiveDate(draft.effectiveDate)}
          />
          <SummaryItem
            label="Selected employees"
            value={String(reviewRows.length)}
          />
        </dl>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="shrink-0 border-b border-border px-5 py-3">
          <h2 className="text-h2 text-text-black">Selected recipients</h2>
        </div>

        <div
          ref={tableAreaRef}
          className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-1"
        >
          <table className="w-full min-w-[1100px] table-fixed text-left">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[8%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="h-11 border-b border-border bg-surface-muted text-small text-text-gray">
                <th className="px-4 py-3 font-bold uppercase tracking-wide">
                  Employee Name
                </th>
                <th className="px-4 py-3 font-bold uppercase tracking-wide">
                  Group
                </th>
                <th className="px-4 py-3 font-bold uppercase tracking-wide">
                  Years of Service
                </th>
                <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                  VL Before
                </th>
                <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                  VL To Add
                </th>
                <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                  VL After
                </th>
                <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                  SL Before
                </th>
                <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                  SL To Add
                </th>
                <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                  SL After
                </th>
              </tr>
            </thead>
            <tbody>
              {showSkeleton ? (
                <TableBodySkeleton
                  rows={pageSize}
                  cols={9}
                  rowClassName={APPROVALS_TABLE_ROW_HEIGHT_CLASS}
                />
              ) : paginatedItems.length === 0 ? (
                <tr className={APPROVALS_TABLE_ROW_HEIGHT_CLASS}>
                  <td
                    colSpan={9}
                    className="px-5 text-center text-body text-text-gray"
                  >
                    No recipients selected.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((row) => (
                  <tr
                    key={row.employee.id}
                    className={`${APPROVALS_TABLE_ROW_HEIGHT_CLASS} border-b border-border last:border-b-0`}
                  >
                    <td
                      className="truncate px-4 text-body text-text-black"
                      title={row.employee.name}
                    >
                      {row.employee.name}
                    </td>
                    <td className="px-4 text-body text-text-black">
                      {row.employee.groupLabel}
                    </td>
                    <td className="px-4 text-body text-text-black">
                      {row.yearsOfServiceLabel}
                    </td>
                    <td className="px-3 text-center text-body text-text-black">
                      {formatBalanceValue(row.vlBefore)}
                    </td>
                    <td className="px-3 text-center text-body text-text-black">
                      {formatBalanceValue(row.vlToAdd)}
                    </td>
                    <td className="px-3 text-center text-body font-medium text-text-black">
                      {formatBalanceValue(row.vlAfter)}
                    </td>
                    <td className="px-3 text-center text-body text-text-black">
                      {formatBalanceValue(row.slBefore)}
                    </td>
                    <td className="px-3 text-center text-body text-text-black">
                      {formatBalanceValue(row.slToAdd)}
                    </td>
                    <td className="px-3 text-center text-body font-medium text-text-black">
                      {formatBalanceValue(row.slAfter)}
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
          totalItems={reviewRows.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </section>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <Link
          to={distributionEmployeesPath('annual')}
          className="rounded-md border border-border bg-surface px-4 py-2.5 text-body font-medium text-text-black transition-colors hover:bg-surface-muted"
        >
          Back
        </Link>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="rounded-md bg-primary px-4 py-2.5 text-body font-medium text-white transition-opacity hover:opacity-90"
        >
          Confirm
        </button>
      </div>

      <ConfirmReasonModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => handleConfirmApply()}
        requireReason={false}
        confirmVariant="primary"
        title="Confirm distribution"
        description="Apply this annual leave credit distribution?"
        confirmLabel="Apply"
      />

      <SuccessDialog
        open={successOpen}
        onClose={handleSuccessClose}
        title="Distribution applied"
        message="Annual leave credits have been distributed to the selected employees."
        confirmLabel="Back to Leave Balances"
      />
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-small text-text-gray">{label}</dt>
      <dd className="mt-0.5 text-body font-semibold text-text-black">{value}</dd>
    </div>
  )
}
