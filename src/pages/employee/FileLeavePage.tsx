import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { TriangleAlert } from 'lucide-react'
import { ApiError } from '../../api/axios-client'
import { createLeave } from '../../api/leaves'
import type { DayType as ApiDayType } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { DateFieldCustom } from '../../components/ui/form/DateFieldCustom'
import { SelectField } from '../../components/ui/form/SelectField'
import { TextAreaField } from '../../components/ui/form/TextAreaField'
import { TextField } from '../../components/ui/form/TextField'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import { VACATION_LEAVE_THEME } from '../../constants/leaveTypeTheme'
import { swrKeys } from '../../hooks/api/swrKeys'
import {
  countLeaveDurationDays,
  formatDurationLabel,
  todayISO,
  usesCalendarDayCounting,
  type DayType,
} from '../../utils/leaveDates'
import { validateLeaveLeadTime } from '../../utils/leaveLeadTime'

const DAY_TYPE_OPTIONS = [
  { value: '', label: 'Select Day Type' },
  { value: 'full', label: 'Whole day' },
  { value: 'half_am', label: 'Half day (AM)' },
  { value: 'half_pm', label: 'Half day (PM)' },
] as const

/** Only VL is supported by POST /leaves for now. */
const LEAVE_TYPE_OPTIONS = [
  { value: '', label: 'Select Leave Type' },
  { value: VACATION_LEAVE_THEME.label, label: VACATION_LEAVE_THEME.label },
]

const EMPTY_FORM = {
  leaveType: '',
  dayType: '' as '' | DayType,
  startDate: '',
  endDate: '',
  reason: '',
}

function messageFromApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body
    if (body && typeof body === 'object' && 'errors' in body) {
      const errors = (body as { errors: Record<string, string[]> }).errors
      const first = Object.values(errors).flat()[0]
      if (typeof first === 'string' && first.length > 0) return first
    }
    if (error.message) return error.message
  }
  return 'Unable to submit leave request. Please try again.'
}

export function FileLeavePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { mutate } = useSWRConfig()

  const [leaveType, setLeaveType] = useState(EMPTY_FORM.leaveType)
  const [dayType, setDayType] = useState<'' | DayType>(EMPTY_FORM.dayType)
  const [startDate, setStartDate] = useState(EMPTY_FORM.startDate)
  const [endDate, setEndDate] = useState(EMPTY_FORM.endDate)
  const [reason, setReason] = useState(EMPTY_FORM.reason)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const dayTypeEnabled = leaveType !== ''
  const startDateEnabled = leaveType !== '' && dayType !== ''
  const endDateEnabled = startDate !== ''

  const leaveDuration = useMemo(() => {
    if (!startDate || !endDate) return 0
    if (dayType === 'half_am' || dayType === 'half_pm') return 0.5
    if (dayType !== 'full') return 0
    return countLeaveDurationDays(leaveType, startDate, endDate)
  }, [dayType, startDate, endDate, leaveType])

  const durationLabel = useMemo(() => {
    if (!dayType || (!startDate && !endDate)) return '0 day(s)'
    if (dayType === 'half_am' || dayType === 'half_pm') {
      return formatDurationLabel(0.5, dayType)
    }
    return formatDurationLabel(leaveDuration, 'full')
  }, [dayType, startDate, endDate, leaveDuration])

  const leadTimeValidation = useMemo(
    () =>
      validateLeaveLeadTime({
        dayType: dayType === '' ? 'full' : dayType,
        weekdayDuration: dayType === 'full' ? leaveDuration : 0,
        startDateISO: startDate,
        filedOnISO: todayISO(),
      }),
    [dayType, leaveDuration, startDate],
  )

  const workingDaysOnly =
    leaveType !== '' && !usesCalendarDayCounting(leaveType)

  const leaveTypeMissing = leaveType === ''
  const dayTypeMissing = dayType === ''
  const startMissing = startDate === ''
  const endMissing = endDate === ''
  const reasonMissing = reason.trim().length === 0

  const formValid =
    !leaveTypeMissing &&
    !dayTypeMissing &&
    !startMissing &&
    !endMissing &&
    !reasonMissing &&
    leadTimeValidation.ok &&
    leaveType === VACATION_LEAVE_THEME.label

  function handleLeaveTypeChange(value: string) {
    setLeaveType(value)
    setDayType(EMPTY_FORM.dayType)
    setStartDate(EMPTY_FORM.startDate)
    setEndDate(EMPTY_FORM.endDate)
    setSubmitError(null)
  }

  function handleDayTypeChange(value: string) {
    setDayType(value as '' | DayType)
    setStartDate(EMPTY_FORM.startDate)
    setEndDate(EMPTY_FORM.endDate)
  }

  function handleClear() {
    setLeaveType(EMPTY_FORM.leaveType)
    setDayType(EMPTY_FORM.dayType)
    setStartDate(EMPTY_FORM.startDate)
    setEndDate(EMPTY_FORM.endDate)
    setReason(EMPTY_FORM.reason)
    setTriedSubmit(false)
    setSubmitError(null)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTriedSubmit(true)
    setSubmitError(null)
    if (!formValid) return
    setConfirmOpen(true)
  }

  async function handleConfirmSubmit() {
    if (dayType === '' || leaveType !== VACATION_LEAVE_THEME.label) return

    setConfirmOpen(false)
    setSubmitting(true)
    setSubmitError(null)

    try {
      await createLeave({
        start_date: startDate,
        end_date: endDate,
        day_type: dayType as ApiDayType,
        leave_reason: reason.trim(),
      })

      await Promise.all([
        mutate(
          (key) => Array.isArray(key) && key[0] === 'leaves',
          undefined,
          { revalidate: true },
        ),
        mutate(swrKeys.balances()),
      ])

      setSuccessOpen(true)
    } catch (error) {
      setSubmitError(messageFromApiError(error))
    } finally {
      setSubmitting(false)
    }
  }

  function handleSuccessClose() {
    setSuccessOpen(false)
    navigate('/dashboard')
  }

  function handleStartDateChange(value: string) {
    setStartDate(value)
    setEndDate(value)
  }

  function handleEndDateChange(value: string) {
    setEndDate(value)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
      >
        <h1 className="shrink-0 text-h1 text-text-black">Apply Leave</h1>

        <section className="shrink-0 overflow-visible rounded-lg border border-border bg-surface px-4 py-3 sm:px-5">
          <h2 className="text-h2 text-text-black">Employee Information</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TextField
              label="Employee No."
              value={user.employeeNumber}
              readOnly
            />
            <TextField label="Employee Name" value={user.name} readOnly />
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
          <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-h2 text-text-black">Leave Information</h2>
            <p className="mt-1 text-small text-text-gray">
              Only Vacation Leave can be filed online for now. Other leave types
              will be available when their APIs are ready.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
            <div className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2">
              <SelectField
                label="Leave Type"
                value={leaveType}
                onChange={handleLeaveTypeChange}
                options={LEAVE_TYPE_OPTIONS}
              />
              <SelectField
                label="Day Type"
                value={dayType}
                onChange={handleDayTypeChange}
                options={[...DAY_TYPE_OPTIONS]}
                disabled={!dayTypeEnabled}
              />
              <DateFieldCustom
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                weekdaysOnly={workingDaysOnly}
                disabled={!startDateEnabled}
                max={endDate || undefined}
              />
              <DateFieldCustom
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                weekdaysOnly={workingDaysOnly}
                disabled={!endDateEnabled}
                min={startDate || undefined}
              />
              <TextField
                label="Duration"
                value={durationLabel}
                readOnly
                className="sm:col-span-2"
              />
              {leadTimeValidation.isLongLeave ? (
                <div
                  className={`flex gap-3 rounded-md border-2 px-3 py-3 sm:col-span-2 ${
                    leadTimeValidation.ok
                      ? 'border-status-pending bg-status-pending/15'
                      : 'border-status-rejected bg-status-rejected/10'
                  }`}
                  role="alert"
                >
                  <TriangleAlert
                    className={`mt-0.5 size-5 shrink-0 ${
                      leadTimeValidation.ok
                        ? 'text-status-pending'
                        : 'text-status-rejected'
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-small font-semibold text-text-black">
                      {leadTimeValidation.ok
                        ? 'Advance filing required (3+ days)'
                        : 'Filing not allowed'}
                    </p>
                    <p className="mt-1 text-small text-text-black">
                      {leadTimeValidation.message}
                      {leadTimeValidation.ok
                        ? ' Your selected dates meet this requirement.'
                        : ' Please choose a start date at least 1 month from today, or shorten the leave duration.'}
                    </p>
                  </div>
                </div>
              ) : null}
              <TextAreaField
                label="Reason"
                value={reason}
                onChange={setReason}
                placeholder="Enter reason for leave"
                className="sm:col-span-2"
                rows={2}
              />
              {triedSubmit && reasonMissing ? (
                <p
                  className="-mt-1 text-small text-status-rejected sm:col-span-2"
                  role="alert"
                >
                  Reason is required.
                </p>
              ) : null}
              {triedSubmit &&
              (leaveTypeMissing ||
                dayTypeMissing ||
                startMissing ||
                endMissing) ? (
                <p
                  className="text-small text-status-rejected sm:col-span-2"
                  role="alert"
                >
                  Please complete Leave Type, Day Type, Start Date, and End Date.
                </p>
              ) : null}
              {submitError ? (
                <p
                  className="text-small text-status-rejected sm:col-span-2"
                  role="alert"
                >
                  {submitError}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button type="button" onClick={handleClear} disabled={submitting}>
            Clear
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!leadTimeValidation.ok || submitting}
            title={submitting ? 'Submitting…' : undefined}
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </Button>
        </div>
      </form>

      <ConfirmReasonModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          void handleConfirmSubmit()
        }}
        title="Confirm leave request"
        description="Are you sure you want to submit this leave request?"
        requireReason={false}
        confirmLabel="Submit request"
        cancelLabel="Go back"
        confirmVariant="primary"
      />

      <SuccessDialog
        open={successOpen}
        onClose={handleSuccessClose}
        title="Request submitted"
        message="Your leave request has been submitted successfully."
        confirmLabel="Back to dashboard"
      />
    </div>
  )
}
