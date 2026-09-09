import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { mutate } from 'swr'
import { ArrowLeft } from 'lucide-react'
import { ApiError } from '../../api/axios-client'
import {
  distributeContractualEntitlements,
  type ContractualEntitlementEmployeePayload,
} from '../../api/adminContractualEntitlements'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { Pagination } from '../../components/ui/Pagination'
import { TableBodySkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/ToastProvider'
import { TOAST_CONTRACTUAL_DISTRIBUTION_APPLIED } from '../../constants/toastMessages'
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
import { useAdminContractualEntitlements } from '../../hooks/api/useAdminContractualEntitlements'
import {
  isAdminBalancesListKey,
  isAdminContractualEntitlementsListKey,
} from '../../hooks/api/swrKeys'
import { useContentSizedTableRefs } from '../../hooks/useContentSizedTableRefs'
import { usePagination } from '../../hooks/usePagination'
import { formatAvailableNumber } from '../../utils/adminBalances'
import {
  addAvailableAndGrant,
  clearContractualEntitlementDraft,
  formatContractualAmountForApi,
  getContractualEntitlementDraft,
  parseContractualAmount,
  type ContractualAssignLocationState,
} from '../../utils/contractualEntitlementDraft'
import {
  distributionAssignPath,
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

export function ContractualDistributionReviewPage() {
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

  const draft = useMemo(() => getContractualEntitlementDraft(), [])

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const listParams = useMemo(() => {
    if (!draft || draft.empIds.length === 0) return null
    return {
      emp_ids: draft.empIds,
      sort: 'asc' as const,
      page: 1,
      per_page: FETCH_PER_PAGE,
    }
  }, [draft])

  const { data, error, isLoading } = useAdminContractualEntitlements(listParams)

  const reviewRows = useMemo(() => {
    if (!draft) return []
    const byId = new Map(
      (data?.data ?? []).map((row) => [row.employee.id, row]),
    )
    return draft.empIds.flatMap((empId) => {
      const row = byId.get(empId)
      if (!row) return []
      const amounts = draft.amountsByEmpId[String(empId)] ?? {
        vlToAdd: '',
        slToAdd: '',
      }
      const vlGrant = parseContractualAmount(amounts.vlToAdd)
      const slGrant = parseContractualAmount(amounts.slToAdd)
      return [
        {
          employee: row.employee,
          groupLabel:
            row.employee.group?.abbreviation ??
            row.employee.group?.name ??
            '—',
          vlBefore: row.vl_available,
          vlToAdd: vlGrant,
          vlAfter: addAvailableAndGrant(row.vl_available, vlGrant),
          slBefore: row.sl_available,
          slToAdd: slGrant,
          slAfter: addAvailableAndGrant(row.sl_available, slGrant),
        },
      ]
    })
  }, [data, draft])

  const showSkeleton = isLoading && !data

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    totalItems,
  } = usePagination(reviewRows, pageSize, 'contractual-review')

  function buildPayload(): ContractualEntitlementEmployeePayload[] {
    if (!draft) return []
    return draft.empIds.flatMap((empId) => {
      const amounts = draft.amountsByEmpId[String(empId)] ?? {
        vlToAdd: '',
        slToAdd: '',
      }
      const vl = parseContractualAmount(amounts.vlToAdd)
      const sl = parseContractualAmount(amounts.slToAdd)
      if (vl == null && sl == null) return []
      const entry: ContractualEntitlementEmployeePayload = { emp_id: empId }
      if (vl != null) entry.vl_to_add = formatContractualAmountForApi(vl)
      if (sl != null) entry.sl_to_add = formatContractualAmountForApi(sl)
      return [entry]
    })
  }

  async function handleConfirmApply() {
    if (!draft || draft.empIds.length === 0) return
    const employees = buildPayload()
    if (employees.length === 0) return

    setConfirmOpen(false)
    setSubmitting(true)
    setSubmitError(null)

    try {
      await distributeContractualEntitlements({ employees })
      clearContractualEntitlementDraft()
      await Promise.all([
        mutate(isAdminContractualEntitlementsListKey, undefined, {
          revalidate: true,
        }),
        mutate(isAdminBalancesListKey, undefined, { revalidate: true }),
      ])
      toast.success(TOAST_CONTRACTUAL_DISTRIBUTION_APPLIED)
      navigate(leaveBalancesLandingPath())
    } catch (err) {
      setSubmitError(
        messageFromApiError(
          err,
          'Unable to apply contractual leave credits. Please try again.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!draft || draft.empIds.length === 0) {
    return <Navigate to={distributionAssignPath('contractual')} replace />
  }

  return (
    <div className={`${TABLE_PAGE_ROOT} gap-4`}>
      <Link
        to={distributionAssignPath('contractual')}
        state={
          {
            empIds: draft.empIds,
            amountsByEmpId: draft.amountsByEmpId,
            groupFilter: draft.groupFilter,
          } satisfies ContractualAssignLocationState
        }
        className="text-body inline-flex w-fit shrink-0 items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to assign credits
      </Link>

      <h1 className="shrink-0 text-h1 text-text-black">
        Review & confirm distribution
      </h1>

      <section className="shrink-0 rounded-lg border border-border bg-surface px-5 py-4">
        <h2 className="text-h2 text-text-black">Distribution Summary</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <SummaryItem label="Type" value="Contractual Employees" />
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
            <table className="w-full min-w-[1100px] table-fixed text-left">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[16%]" />
                <col className="w-[9%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
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
                  <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                    VL Before
                  </th>
                  <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                    VL To Add
                  </th>
                  <th className="px-3 py-3 text-center text-leave-vacation font-bold uppercase tracking-wide">
                    VL After
                  </th>
                  <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                    SL Before
                  </th>
                  <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">
                    SL To Add
                  </th>
                  <th className="px-3 py-3 text-center text-leave-sick font-bold uppercase tracking-wide">
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
                ) : error && !data ? (
                  <TableEmptyRow
                    colSpan={9}
                    pageSize={pageSize}
                    rowHeight={APPROVALS_TABLE_ROW_HEIGHT}
                    variant="no-data"
                    message="Unable to load the selected employees. Please go back and try again."
                  />
                ) : paginatedItems.length === 0 ? (
                  <TableEmptyRow
                    colSpan={9}
                    pageSize={pageSize}
                    rowHeight={APPROVALS_TABLE_ROW_HEIGHT}
                    variant="no-data"
                  />
                ) : (
                  paginatedItems.map((row) => (
                    <tr
                      key={row.employee.id}
                      className={`${APPROVALS_TABLE_ROW_HEIGHT_CLASS} ${TABLE_BODY_ROW_BORDER_CLASS}`}
                    >
                      <td className="px-4 text-body text-text-black">
                        {row.employee.employee_number}
                      </td>
                      <td
                        className="truncate px-4 text-body text-text-black"
                        title={row.employee.name ?? undefined}
                      >
                        {row.employee.name ?? '—'}
                      </td>
                      <td className="px-4 text-body text-text-black">
                        {row.groupLabel}
                      </td>
                      <td className="px-3 text-center text-body text-text-black">
                        {formatAvailableNumber(row.vlBefore)}
                      </td>
                      <td className="px-3 text-center text-body text-text-black">
                        {row.vlToAdd != null
                          ? formatAvailableNumber(row.vlToAdd)
                          : '—'}
                      </td>
                      <td className="bg-leave-vacation/10 px-3 text-center text-body font-semibold text-leave-vacation">
                        {row.vlToAdd != null
                          ? formatAvailableNumber(row.vlAfter)
                          : '—'}
                      </td>
                      <td className="px-3 text-center text-body text-text-black">
                        {formatAvailableNumber(row.slBefore)}
                      </td>
                      <td className="px-3 text-center text-body text-text-black">
                        {row.slToAdd != null
                          ? formatAvailableNumber(row.slToAdd)
                          : '—'}
                      </td>
                      <td className="bg-leave-sick/10 px-3 text-center text-body font-semibold text-leave-sick">
                        {row.slToAdd != null
                          ? formatAvailableNumber(row.slAfter)
                          : '—'}
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
          disabled={
            submitting ||
            showSkeleton ||
            Boolean(error && !data) ||
            reviewRows.length === 0
          }
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
        description="Apply leave credits to the selected contractual employees?"
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
