import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { ConfirmReasonModal } from '../ui/ConfirmReasonModal'
import { Modal } from '../ui/Modal'
import { SuccessDialog } from '../ui/SuccessDialog'
import { SelectField } from '../ui/form/SelectField'
import { TextField } from '../ui/form/TextField'
import { fieldLabelClassName, fieldShellClassName } from '../ui/form/fieldStyles'
import {
  ADJUSTMENT_REASON_OPTIONS,
  LEAVE_BALANCE_KEYS,
  LEAVE_BALANCE_LABELS,
  LEAVE_BALANCE_SHORT,
  applyBalanceAdjustment,
  formatBalanceValue,
  hasDuplicateAdjustment,
  type AdjustmentDirection,
  type AdjustmentReasonCategory,
  type LeaveBalanceEmployee,
  type LeaveBalanceKey,
} from '../../mocks/leaveBalances'

type AdjustCreditsModalProps = {
  open: boolean
  employee: LeaveBalanceEmployee | null
  onClose: () => void
  onSuccess: () => void
}

const DIRECTION_OPTIONS: Array<{ value: AdjustmentDirection; label: string }> =
  [
    { value: 'add', label: 'Add' },
    { value: 'deduct', label: 'Deduct' },
  ]

const LEAVE_TYPE_OPTIONS = LEAVE_BALANCE_KEYS.map((key) => ({
  value: key,
  label: LEAVE_BALANCE_LABELS[key],
}))

const LARGE_ML_ADD_THRESHOLD = 30
const LARGE_PL_ADD_THRESHOLD = 5

function todayIso(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseCredits(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  if (Math.round(parsed * 2) !== parsed * 2) return null
  return parsed
}

function balanceBefore(
  employee: LeaveBalanceEmployee,
  leaveTypeKey: LeaveBalanceKey,
): number {
  return employee.balances[leaveTypeKey] ?? 0
}

export function AdjustCreditsModal({
  open,
  employee,
  onClose,
  onSuccess,
}: AdjustCreditsModalProps) {
  const { user } = useAuth()

  const [leaveTypeKey, setLeaveTypeKey] = useState<LeaveBalanceKey>('vl')
  const [direction, setDirection] = useState<AdjustmentDirection>('add')
  const [credits, setCredits] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(todayIso)
  const [reasonCategory, setReasonCategory] =
    useState<AdjustmentReasonCategory>('distribution_error')
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  useEffect(() => {
    if (!open || !employee) return
    setLeaveTypeKey('vl')
    setDirection('add')
    setCredits('')
    setEffectiveDate(todayIso())
    setReasonCategory('distribution_error')
    setReason('')
    setTouched(false)
    setConfirmOpen(false)
    setSuccessOpen(false)
  }, [open, employee?.id])

  const parsedCredits = parseCredits(credits)
  const before = employee ? balanceBefore(employee, leaveTypeKey) : 0
  const delta =
    parsedCredits == null
      ? 0
      : direction === 'add'
        ? parsedCredits
        : -parsedCredits
  const after = before + delta

  const reasonTrimmed = reason.trim()
  const isOtherReason = reasonCategory === 'other'
  const categoryLabel =
    ADJUSTMENT_REASON_OPTIONS.find((o) => o.value === reasonCategory)?.label ??
    reasonCategory
  const resolvedReason = isOtherReason ? reasonTrimmed : categoryLabel
  const reasonInvalid =
    isOtherReason && touched && reasonTrimmed.length < 10
  const deductWouldGoNegative =
    direction === 'deduct' && parsedCredits != null && after < 0
  const invalidCredits = credits.trim().length > 0 && parsedCredits == null

  const isDuplicate =
    employee != null &&
    parsedCredits != null &&
    effectiveDate.length > 0 &&
    hasDuplicateAdjustment(
      employee.id,
      leaveTypeKey,
      parsedCredits,
      effectiveDate,
    )

  const largeParentalAdd =
    direction === 'add' &&
    parsedCredits != null &&
    ((leaveTypeKey === 'ml' && parsedCredits >= LARGE_ML_ADD_THRESHOLD) ||
      (leaveTypeKey === 'pl' && parsedCredits >= LARGE_PL_ADD_THRESHOLD))

  const canContinue =
    employee != null &&
    parsedCredits != null &&
    effectiveDate.length > 0 &&
    (!isOtherReason || reasonTrimmed.length >= 10) &&
    !deductWouldGoNegative

  const confirmDescription = useMemo(() => {
    if (!employee || parsedCredits == null) return ''
    const short = LEAVE_BALANCE_SHORT[leaveTypeKey]
    const signed =
      direction === 'add'
        ? `+${formatBalanceValue(parsedCredits)}`
        : `-${formatBalanceValue(parsedCredits)}`
    const categoryLabel =
      ADJUSTMENT_REASON_OPTIONS.find((o) => o.value === reasonCategory)
        ?.label ?? reasonCategory
    return [
      `Apply ${signed} ${short} for ${employee.name} (${employee.employeeNumber})?`,
      `Effective ${effectiveDate}. Balance: ${formatBalanceValue(before)} → ${formatBalanceValue(after)}.`,
      `Category: ${categoryLabel}.`,
      isOtherReason ? `Reason: ${reasonTrimmed}.` : null,
    ]
      .filter(Boolean)
      .join(' ')
  }, [
    employee,
    parsedCredits,
    leaveTypeKey,
    direction,
    effectiveDate,
    before,
    after,
    reasonCategory,
    isOtherReason,
    reasonTrimmed,
  ])

  function handleClose() {
    setConfirmOpen(false)
    setSuccessOpen(false)
    onClose()
  }

  function handleContinue() {
    setTouched(true)
    if (!canContinue) return
    setConfirmOpen(true)
  }

  function handleConfirmApply() {
    if (!employee || parsedCredits == null) return
    const result = applyBalanceAdjustment(employee.id, {
      leaveTypeKey,
      direction,
      amount: parsedCredits,
      effectiveDate,
      reasonCategory,
      reason: resolvedReason,
      performedBy: user.name,
    })
    if (!result) return
    setConfirmOpen(false)
    setSuccessOpen(true)
  }

  function handleSuccessClose() {
    setSuccessOpen(false)
    onSuccess()
    onClose()
  }

  if (!employee) return null

  const short = LEAVE_BALANCE_SHORT[leaveTypeKey]
  const signedDelta =
    parsedCredits == null
      ? '—'
      : direction === 'add'
        ? `+${formatBalanceValue(parsedCredits)}`
        : `-${formatBalanceValue(parsedCredits)}`

  return (
    <>
      <Modal
        open={open && !successOpen}
        onClose={handleClose}
        title="Adjust leave credits"
        maxWidthClass="max-w-2xl"
        footer={
          <>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-border bg-surface px-4 py-2.5 text-body font-medium text-text-black transition-colors hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="rounded-md bg-primary px-4 py-2.5 text-body font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <section className="rounded-lg border border-border bg-surface-muted px-4 py-3">
            <p className="text-body font-semibold text-text-black">
              {employee.name}
            </p>
            <p className="mt-0.5 text-small text-text-gray">
              {employee.employeeNumber} · {employee.groupLabel}
            </p>
            <dl className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {LEAVE_BALANCE_KEYS.map((key) => (
                <div key={key}>
                  <dt className="text-small text-text-gray">
                    {LEAVE_BALANCE_SHORT[key]}
                  </dt>
                  <dd className="text-body font-medium text-text-black">
                    {formatBalanceValue(employee.balances[key])}
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
              options={LEAVE_TYPE_OPTIONS}
            />
            <SelectField
              label="Direction"
              value={direction}
              onChange={(value) =>
                setDirection(value as AdjustmentDirection)
              }
              options={DIRECTION_OPTIONS}
            />
            <TextField
              label="Credits"
              type="number"
              value={credits}
              onChange={setCredits}
              placeholder="0.5 step, e.g. 1 or 1.5"
            />
            <div className="min-w-0">
              <label
                htmlFor="adjust-effective-date"
                className={fieldLabelClassName}
              >
                Effective date
              </label>
              <div className={fieldShellClassName}>
                <input
                  id="adjust-effective-date"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="box-border w-full min-h-11 rounded-md border border-border bg-surface px-3 py-2.5 text-body text-text-black outline-none transition-[border-color,box-shadow] hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <section className="rounded-lg border border-border bg-surface-muted px-4 py-3">
            <p className="text-small font-semibold text-text-black">
              Balance preview ({short})
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-body text-text-black">
              <span>{formatBalanceValue(before)}</span>
              <span className="text-text-gray" aria-hidden="true">
                →
              </span>
              <span className="font-medium">{signedDelta}</span>
              <span className="text-text-gray" aria-hidden="true">
                →
              </span>
              <span className="font-semibold">
                {parsedCredits == null ? '—' : formatBalanceValue(after)}
              </span>
            </div>
          </section>

          {(invalidCredits || deductWouldGoNegative || reasonInvalid) && (
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
            </div>
          )}

          {(isDuplicate || largeParentalAdd) && (
            <div className="rounded-md border border-status-pending/40 bg-status-pending/10 px-3 py-2 text-small text-text-black">
              {isDuplicate ? (
                <p>
                  A similar adjustment for this employee, leave type, amount,
                  and effective date was recorded recently.
                </p>
              ) : null}
              {largeParentalAdd ? (
                <p className={isDuplicate ? 'mt-1' : undefined}>
                  This is a large {LEAVE_BALANCE_LABELS[leaveTypeKey]} grant.
                  Please confirm it is intentional.
                </p>
              ) : null}
            </div>
          )}

          <SelectField
            label="Reason category"
            value={reasonCategory}
            onChange={(value) => {
              const next = value as AdjustmentReasonCategory
              setReasonCategory(next)
              if (next !== 'other') setReason('')
            }}
            options={ADJUSTMENT_REASON_OPTIONS}
          />

          {isOtherReason ? (
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className={fieldLabelClassName}>
                Reason
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

          <p className="text-small text-text-gray">
            For corrections and exceptions only. Use Distribute Leave Credits
            for routine grants.
          </p>
        </div>
      </Modal>

      <ConfirmReasonModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmApply}
        requireReason={false}
        confirmVariant="primary"
        title="Confirm adjustment"
        description={confirmDescription}
        confirmLabel="Apply adjustment"
        cancelLabel="Go back"
      />

      <SuccessDialog
        open={successOpen}
        onClose={handleSuccessClose}
        title="Adjustment applied"
        message={`Leave credits for ${employee.name} have been updated.`}
        confirmLabel="OK"
      />
    </>
  )
}
