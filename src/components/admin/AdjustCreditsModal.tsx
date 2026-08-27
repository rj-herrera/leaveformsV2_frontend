import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../api/axios-client'
import { adjustAdminBalance } from '../../api/adminBalances'
import type { AdminEmployeeBalanceRow } from '../../api/types'
import { toastLeaveCreditsAdjusted } from '../../constants/toastMessages'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/ToastProvider'
import { SelectField } from '../ui/form/SelectField'
import { TextField } from '../ui/form/TextField'
import { fieldLabelClassName } from '../ui/form/fieldStyles'
import {
  ADJUSTMENT_REASON_OPTIONS,
  LEAVE_BALANCE_KEYS,
  LEAVE_BALANCE_LABELS,
  LEAVE_BALANCE_SHORT,
  type AdjustmentDirection,
  type AdjustmentReasonCategory,
  type LeaveBalanceKey,
} from '../../mocks/leaveBalances'
import {
  ADMIN_BALANCE_COLUMN_CODES,
  adminBalanceAvailableNumber,
  formatAdminBalanceAvailable,
  formatAvailableDelta,
  formatAvailableNumber,
  isAdminBalanceTypeApplicable,
} from '../../utils/adminBalances'

type AdjustCreditsModalProps = {
  open: boolean
  employee: AdminEmployeeBalanceRow | null
  onClose: () => void
  onSuccess: () => void
}

const DIRECTION_OPTIONS: Array<{ value: AdjustmentDirection; label: string }> =
  [
    { value: 'add', label: 'Add' },
    { value: 'deduct', label: 'Deduct' },
  ]

const LARGE_ML_ADD_THRESHOLD = 30
const LARGE_PL_ADD_THRESHOLD = 5

function parseCredits(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  if (Math.round(parsed * 2) !== parsed * 2) return null
  return parsed
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

function defaultLeaveTypeKey(
  employee: AdminEmployeeBalanceRow,
): LeaveBalanceKey {
  const applicable = LEAVE_BALANCE_KEYS.find((key) =>
    isAdminBalanceTypeApplicable(employee, key),
  )
  return applicable ?? 'vl'
}

export function AdjustCreditsModal({
  open,
  employee,
  onClose,
  onSuccess,
}: AdjustCreditsModalProps) {
  const toast = useToast()

  const [leaveTypeKey, setLeaveTypeKey] = useState<LeaveBalanceKey>('vl')
  const [direction, setDirection] = useState<AdjustmentDirection>('add')
  const [credits, setCredits] = useState('')
  const [reasonCategory, setReasonCategory] =
    useState<AdjustmentReasonCategory>('distribution_error')
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !employee) return
    setLeaveTypeKey(defaultLeaveTypeKey(employee))
    setDirection('add')
    setCredits('')
    setReasonCategory('distribution_error')
    setReason('')
    setTouched(false)
    setSubmitting(false)
    setSubmitError(null)
  }, [open, employee?.employee.id])

  const leaveTypeOptions = useMemo(() => {
    if (!employee) return []
    return LEAVE_BALANCE_KEYS.filter((key) =>
      isAdminBalanceTypeApplicable(employee, key),
    ).map((key) => ({
      value: key,
      label: LEAVE_BALANCE_LABELS[key],
    }))
  }, [employee])

  const parsedCredits = parseCredits(credits)
  const before = employee
    ? adminBalanceAvailableNumber(employee, leaveTypeKey)
    : 0
  const delta =
    parsedCredits == null
      ? 0
      : direction === 'add'
        ? parsedCredits
        : -parsedCredits
  const after = before + delta

  const isOtherReason = reasonCategory === 'other'
  const reasonTrimmed = reason.trim()
  const categoryLabel =
    ADJUSTMENT_REASON_OPTIONS.find((o) => o.value === reasonCategory)?.label ??
    reasonCategory
  const remarks = isOtherReason ? reasonTrimmed : categoryLabel
  const reasonInvalid = isOtherReason && touched && reasonTrimmed.length < 10

  const deductWouldGoNegative =
    direction === 'deduct' && parsedCredits != null && after < 0
  const invalidCredits = credits.trim().length > 0 && parsedCredits == null

  const largeParentalAdd =
    direction === 'add' &&
    parsedCredits != null &&
    ((leaveTypeKey === 'ml' && parsedCredits >= LARGE_ML_ADD_THRESHOLD) ||
      (leaveTypeKey === 'pl' && parsedCredits >= LARGE_PL_ADD_THRESHOLD))

  const canContinue =
    employee != null &&
    parsedCredits != null &&
    leaveTypeOptions.some((o) => o.value === leaveTypeKey) &&
    (!isOtherReason || reasonTrimmed.length >= 10) &&
    !deductWouldGoNegative &&
    !submitting

  async function handleContinue() {
    setTouched(true)
    if (!canContinue || !employee || parsedCredits == null) return
    if (isOtherReason && reasonTrimmed.length < 10) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      await adjustAdminBalance({
        emp_id: employee.employee.id,
        code: ADMIN_BALANCE_COLUMN_CODES[leaveTypeKey],
        available_delta: formatAvailableDelta(parsedCredits, direction),
        remarks,
      })
      const employeeName = employee.employee.name ?? 'employee'
      onSuccess()
      onClose()
      queueMicrotask(() => {
        toast.success(toastLeaveCreditsAdjusted(employeeName))
      })
    } catch (err) {
      setSubmitError(
        messageFromApiError(
          err,
          'Unable to adjust leave credits. Please try again.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!employee) return null

  const emp = employee.employee
  const groupLabel =
    emp.group?.abbreviation ?? emp.group?.name ?? '—'
  const short = LEAVE_BALANCE_SHORT[leaveTypeKey]
  const signedDelta =
    parsedCredits == null
      ? '—'
      : direction === 'add'
        ? `+${formatAvailableNumber(parsedCredits)}`
        : `-${formatAvailableNumber(parsedCredits)}`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adjust leave credits"
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-border bg-surface px-4 py-2.5 text-body font-medium text-text-black transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={!canContinue}
            className="rounded-md bg-primary px-4 py-2.5 text-body font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Confirm'}
          </button>
        </>
      }
    >
      <p className="text-small text-text-gray uppercase mb-3">
        For corrections and exceptions only. Use Distribute Leave Credits for
        routine grants.
      </p>

      <div className="flex flex-col gap-5">
        <section className="rounded-lg border border-border bg-surface-muted px-4 py-3">
          <p className="text-body font-semibold text-text-black">
            {emp.name ?? '—'}
          </p>
          <p className="mt-0.5 text-small text-text-gray">
            {emp.employee_number} · {groupLabel}
          </p>
          <dl className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {LEAVE_BALANCE_KEYS.map((key) => (
              <div key={key}>
                <dt className="text-small text-text-gray">
                  {LEAVE_BALANCE_SHORT[key]}
                </dt>
                <dd className="text-body font-medium text-text-black">
                  {formatAdminBalanceAvailable(employee.balances, key)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <SelectField
            label="Leave type"
            value={leaveTypeKey}
            onChange={(value) => setLeaveTypeKey(value as LeaveBalanceKey)}
            options={leaveTypeOptions}
          />
          <SelectField
            label="Direction"
            value={direction}
            onChange={(value) => setDirection(value as AdjustmentDirection)}
            options={DIRECTION_OPTIONS}
          />
          <TextField
            label="Credits"
            type="number"
            value={credits}
            onChange={setCredits}
            placeholder="0.5 step, e.g. 1 or 1.5"
          />
          <SelectField
            label="Reason"
            value={reasonCategory}
            onChange={(value) => {
              const next = value as AdjustmentReasonCategory
              setReasonCategory(next)
              if (next !== 'other') setReason('')
            }}
            options={ADJUSTMENT_REASON_OPTIONS}
          />
        </div>

        {isOtherReason ? (
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className={fieldLabelClassName}>
              Specific reason
              <span className="text-status-rejected"> *</span>
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={3}
              placeholder="Enter reason for this adjustment (min. 10 characters)…"
              className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-body text-text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        ) : null}

        <section className="rounded-lg border border-border bg-surface-muted px-4 py-3">
          <p className="text-small font-semibold text-text-black">
            Balance preview ({short})
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-body text-text-black">
            <span>{formatAvailableNumber(before)}</span>
            <span className="text-text-gray" aria-hidden="true">
              →
            </span>
            <span className="font-medium">{signedDelta}</span>
            <span className="text-text-gray" aria-hidden="true">
              →
            </span>
            <span className="font-semibold">
              {parsedCredits == null ? '—' : formatAvailableNumber(after)}
            </span>
          </div>
        </section>

        {(invalidCredits ||
          deductWouldGoNegative ||
          reasonInvalid ||
          submitError) && (
          <div className="rounded-md border border-status-rejected/30 bg-status-rejected/5 px-3 py-2 text-small text-status-rejected">
            {invalidCredits ? (
              <p>Credits must be greater than 0 in 0.5 steps.</p>
            ) : null}
            {deductWouldGoNegative ? (
              <p>Deduction cannot bring the balance below zero.</p>
            ) : null}
            {reasonInvalid ? (
              <p>Reason must be at least 10 characters.</p>
            ) : null}
            {submitError ? <p>{submitError}</p> : null}
          </div>
        )}

        {largeParentalAdd ? (
          <div className="rounded-md border border-status-pending/40 bg-status-pending/10 px-3 py-2 text-small text-text-black">
            <p>
              This is a large {LEAVE_BALANCE_LABELS[leaveTypeKey]} grant. Please
              confirm it is intentional.
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
