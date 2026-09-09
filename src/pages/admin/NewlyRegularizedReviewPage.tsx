import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { mutate } from 'swr'
import { ArrowLeft } from 'lucide-react'
import { ApiError } from '../../api/axios-client'
import { distributeNewlyRegularized } from '../../api/adminNewlyRegularized'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { Pagination } from '../../components/ui/Pagination'
import { TableBodySkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/ToastProvider'
import { TOAST_NEWLY_REGULARIZED_DISTRIBUTION_APPLIED } from '../../constants/toastMessages'
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
  APPROVALS_TABLE_ROW_HEIGHT,
  APPROVALS_TABLE_ROW_HEIGHT_CLASS,
} from '../../components/ui/tableStyles'
import { useAdminNewlyRegularized } from '../../hooks/api/useAdminNewlyRegularized'
import {
  isAdminBalancesListKey,
  isAdminNewlyRegularizedListKey,
} from '../../hooks/api/swrKeys'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import { usePagination } from '../../hooks/usePagination'
import { formatAvailableNumber } from '../../utils/adminBalances'
import {
  clearNewlyRegularizedDraft,
  formatMonthsProrated,
  getNewlyRegularizedDraft,
  type NewlyRegularizedSelectLocationState,
} from '../../utils/newlyRegularizedDraft'
import {
  distributionEmployeesPath,
  leaveBalancesLandingPath,
} from '../../utils/distributionPaths'

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

function messageFromApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const body = error.body
    if (body && typeof body === 'object' && 'errors' in body) {
      const errors = (body as { errors: Record<string, string[]> }).errors
      const first = Object.values(errors).flat()[0]
      if (typeof first === 'string' && first.length > 0) return first
    }
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message: unknown }).message
      if (typeof message === 'string' && message.trim()) return message
    }
    if (error.message) return error.message
  }
  return fallback
}

export function NewlyRegularizedReviewPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const {
    availableSlotRef,
    sectionHeaderRef,
    paginationRef,
    tableAreaRef,
    pageSize: measuredPageSize,
  } = useContentSizedTableRefs({ fallbackRowHeight: APPROVALS_TABLE_ROW_HEIGHT })
  const pageSize = useDebouncedValue(measuredPageSize, PAGE_SIZE_DEBOUNCE_MS)

  const draft = useMemo(() => getNewlyRegularizedDraft(), [])

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const listParams = useMemo(() => {
    if (!draft || draft.empIds.length === 0) return null
    return {
      year: draft.year,
      emp_ids: draft.empIds,
      sort: 'asc' as const,
      page: 1,
      per_page: FETCH_PER_PAGE,
    }
  }, [draft])

  const { data, error, isLoading } = useAdminNewlyRegularized(listParams)

  const rows = data?.data ?? []
  const hasAlreadyGranted = rows.some((row) => row.already_granted)
  const showSkeleton = isLoading && !data

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    totalItems,
  } = usePagination(rows, pageSize, 'newly-reg-review')

  async function handleConfirmApply() {
    if (!draft || draft.empIds.length === 0) return

    setConfirmOpen(false)
    setSubmitting(true)
    setSubmitError(null)

    try {
      await distributeNewlyRegularized({
        year: draft.year,
        emp_ids: draft.empIds,
      })
      clearNewlyRegularizedDraft()
      await Promise.all([
        mutate(isAdminNewlyRegularizedListKey, undefined, {
          revalidate: true,
        }),
        mutate(isAdminBalancesListKey, undefined, { revalidate: true }),
      ])
      toast.success(TOAST_NEWLY_REGULARIZED_DISTRIBUTION_APPLIED)
      navigate(leaveBalancesLandingPath())
    } catch (err) {
      setSubmitError(
        messageFromApiError(
          err,
          'Unable to apply newly regularized leave credits. Please try again.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!draft || draft.empIds.length === 0) {
    return (
      <Navigate to={distributionEmployeesPath('newly-regularized')} replace />
    )
  }

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <Link
        to={distributionEmployeesPath('newly-regularized')}
        state={
          {
            empIds: draft.empIds,
            groupFilter: draft.groupFilter,
          } satisfies NewlyRegularizedSelectLocationState
        }
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
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <SummaryItem label="Type" value="Newly Regularized Employees" />
          <SummaryItem
            label="Selected employees"
            value={String(draft.empIds.length)}
          />
        </dl>
        {submitError ? (
          <p className="mt-3 text-small text-status-rejected">{submitError}</p>
        ) : null}
      </section>

      <div ref={availableSlotRef} className={TABLE_AVAILABLE_SLOT}>
        <section
          className={`${TABLE_CONTENT_SECTION} rounded-lg border border-border bg-surface`}
        >
          <div
            ref={sectionHeaderRef}
            className="shrink-0 border-b border-border px-5 py-3"
          >
            <h2 className="text-h2 text-text-black">Selected recipients</h2>
          </div>

          <div ref={tableAreaRef} className={TABLE_CONTENT_AREA}>
            <table className="w-full min-w-[960px] table-fixed text-left">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[20%]" />
                <col className="w-[10%]" />
                <col className="w-[18%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead>
                <tr className="h-11 border-b border-border bg-surface-muted text-small text-text-gray">
                  <th className="px-4 py-3 font-bold uppercase tracking-wide">
                    Employee No.
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wide">
                    Employee Name
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wide">
                    Group
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wide">
                    Months Prorated
                  </th>
                  <th className="px-3 py-3 text-center text-leave-vacation font-bold uppercase tracking-wide">
                    VL to Add
                  </th>
                  <th className="px-3 py-3 text-center text-leave-sick font-bold uppercase tracking-wide">
                    SL to Add
                  </th>
                  <th className="px-3 py-3 text-center text-leave-ptb font-bold uppercase tracking-wide">
                    PTB to Add
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
                    message="Could not load selected employees. Go back and try again."
                  />
                ) : paginatedItems.length === 0 ? (
                  <TableEmptyRow
                    colSpan={7}
                    pageSize={pageSize}
                    rowHeight={APPROVALS_TABLE_ROW_HEIGHT}
                    variant="no-data"
                  />
                ) : (
                  paginatedItems.map((row) => {
                    const emp = row.employee
                    const groupLabel =
                      emp.group?.abbreviation ?? emp.group?.name ?? '—'
                    return (
                      <tr
                        key={emp.id}
                        className={`${APPROVALS_TABLE_ROW_HEIGHT_CLASS} ${TABLE_BODY_ROW_BORDER_CLASS} ${row.already_granted ? 'opacity-60' : ''}`}
                      >
                        <td className="px-4 text-body text-text-black">
                          {emp.employee_number}
                        </td>
                        <td
                          className="truncate px-4 text-body text-text-black"
                          title={emp.name ?? undefined}
                        >
                          {emp.name ?? '—'}
                        </td>
                        <td className="px-4 text-body text-text-black">
                          {groupLabel}
                        </td>
                        <td className="px-4 text-body text-text-black">
                          {formatMonthsProrated(row.months_prorated)}
                        </td>
                        <td className="bg-leave-vacation/10 px-3 text-center text-body font-semibold text-leave-vacation">
                          {formatAvailableNumber(row.vl_grant)}
                        </td>
                        <td className="bg-leave-sick/10 px-3 text-center text-body font-semibold text-leave-sick">
                          {formatAvailableNumber(row.sl_grant)}
                        </td>
                        <td className="bg-leave-ptb/10 px-3 text-center text-body font-semibold text-leave-ptb">
                          {formatAvailableNumber(row.ptb_grant)}
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

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="primary"
          disabled={submitting || showSkeleton || Boolean(error && !data)}
          onClick={() => setConfirmOpen(true)}
        >
          {submitting ? 'Applying…' : 'Confirm'}
        </Button>
      </div>

      <ConfirmReasonModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleConfirmApply()}
        requireReason={false}
        confirmVariant="primary"
        title="Confirm distribution"
        description={
          hasAlreadyGranted
            ? 'If any selected employee has already received leave credits for this year, the entire distribution will fail. Continue only if none of the selected employees have received their credits yet.'
            : 'Apply leave credits to the selected newly regularized employees?'
        }
        confirmLabel="Apply"
        cancelLabel="Cancel"
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
