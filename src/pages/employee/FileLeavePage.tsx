import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { TriangleAlert } from 'lucide-react'
import { createLeave } from '../../api/leaves'
import type { DayType as ApiDayType } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { DateFieldCustom } from '../../components/ui/form/DateFieldCustom'
import { SelectField } from '../../components/ui/form/SelectField'
import { TextAreaField } from '../../components/ui/form/TextAreaField'
import { TextField } from '../../components/ui/form/TextField'
import { useToast } from '../../components/ui/ToastProvider'
import { VACATION_LEAVE_THEME } from '../../constants/leaveTypeTheme'
import { useNonWorkingHolidayDates } from '../../hooks/api/useHolidays'
import { swrKeys, isLeaveListKey } from '../../hooks/api/swrKeys'
import {
  countLeaveDurationDays,
  formatDurationLabel,
  todayISO,
  usesCalendarDayCounting,
  type DayType,
} from '../../utils/leaveDates'
import {
  clearLeaveFormApiErrors,
  parseLeaveFormApiError,
  type LeaveFormApiErrors,
} from '../../utils/leaveFormApiErrors'
import { validateLeaveLeadTime } from '../../utils/leaveLeadTime'

const DAY_TYPE_OPTIONS = [
  { value: 'full', label: 'Whole day' },
  { value: 'half_am', label: 'Half day (AM)' },
  { value: 'half_pm', label: 'Half day (PM)' },
] as const

/** Only VL is supported by POST /leaves for now. */
const LEAVE_TYPE_OPTIONS = [
  { value: VACATION_LEAVE_THEME.label, label: VACATION_LEAVE_THEME.label },
]

const EMPTY_FORM = {
  leaveType: '',
  dayType: '' as '' | DayType,
  startDate: '',
  endDate: '',
  reason: '',
}

export function FileLeavePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { mutate } = useSWRConfig()
  const toast = useToast()
  const { nonWorkingDates, holidayNames } = useNonWorkingHolidayDates()

  const [leaveType, setLeaveType] = useState(EMPTY_FORM.leaveType)
  const [dayType, setDayType] = useState<'' | DayType>(EMPTY_FORM.dayType)
  const [startDate, setStartDate] = useState(EMPTY_FORM.startDate)
  const [endDate, setEndDate] = useState(EMPTY_FORM.endDate)
  const [reason, setReason] = useState(EMPTY_FORM.reason)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apiErrors, setApiErrors] = useState<LeaveFormApiErrors>(
    clearLeaveFormApiErrors,
  )

  const dayTypeEnabled = leaveType !== ''
  const startDateEnabled = leaveType !== '' && dayType !== ''
  const endDateEnabled = startDate !== ''

  function clearApiErrors() {
    setApiErrors(clearLeaveFormApiErrors())
  }

  const leaveDuration = useMemo(() => {
    if (!startDate || !endDate) return 0
    if (dayType === 'half_am' || dayType === 'half_pm') return 0.5
    if (dayType !== 'full') return 0
    return countLeaveDurationDays(
      leaveType,
      startDate,
      endDate,
      nonWorkingDates,
    )
  }, [dayType, startDate, endDate, leaveType, nonWorkingDates])

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
    clearApiErrors()
  }

  function handleDayTypeChange(value: string) {
    setDayType(value as '' | DayType)
    setStartDate(EMPTY_FORM.startDate)
    setEndDate(EMPTY_FORM.endDate)
    clearApiErrors()
  }

  function handleClear() {
    setLeaveType(EMPTY_FORM.leaveType)
    setDayType(EMPTY_FORM.dayType)
    setStartDate(EMPTY_FORM.startDate)
    setEndDate(EMPTY_FORM.endDate)
    setReason(EMPTY_FORM.reason)
    setTriedSubmit(false)
    clearApiErrors()
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTriedSubmit(true)
    clearApiErrors()
    if (!formValid) return
    setConfirmOpen(true)
  }

  async function handleConfirmSubmit() {
    if (dayType === '' || leaveType !== VACATION_LEAVE_THEME.label) return

    setConfirmOpen(false)
    setSubmitting(true)
    clearApiErrors()

    try {
      await createLeave({
        start_date: startDate,
        end_date: endDate,
        day_type: dayType as ApiDayType,
        leave_reason: reason.trim(),
      })

      await Promise.all([
        mutate(isLeaveListKey, undefined, { revalidate: true }),
        mutate(swrKeys.balances()),
      ])

      toast.success('Leave request submitted successfully.')
      navigate('/dashboard')
    } catch (error) {
      setApiErrors(parseLeaveFormApiError(error))
    } finally {
      setSubmitting(false)
    }
  }

  function handleStartDateChange(value: string) {
    setStartDate(value)
    // Keep end in range: first pick, half-day, or start moved past end.
    if (dayType !== 'full' || !endDate || value > endDate) {
      setEndDate(value)
    }
    clearApiErrors()
  }

  function handleEndDateChange(value: string) {
    setEndDate(value)
    clearApiErrors()
  }

  function handleReasonChange(value: string) {
    setReason(value)
    if (apiErrors.reason || apiErrors.form) clearApiErrors()
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
                placeholder="Select Leave Type"
                options={LEAVE_TYPE_OPTIONS}
                error={
                  triedSubmit && leaveTypeMissing
                    ? 'Please select a leave type.'
                    : null
                }
              />
              <SelectField
                label="Day Type"
                value={dayType}
                onChange={handleDayTypeChange}
                placeholder="Select Day Type"
                options={[...DAY_TYPE_OPTIONS]}
                disabled={!dayTypeEnabled}
                error={
                  triedSubmit && dayTypeEnabled && dayTypeMissing
                    ? 'Please select a day type.'
                    : (apiErrors.dayType ?? null)
                }
              />
              <DateFieldCustom
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                weekdaysOnly={workingDaysOnly}
                nonWorkingDates={nonWorkingDates}
                holidayNames={holidayNames}
                disabled={!startDateEnabled}
                invalid={Boolean(apiErrors.dates) && !startMissing}
                error={
                  triedSubmit && startDateEnabled && startMissing
                    ? 'Please select a start date.'
                    : null
                }
              />
              <DateFieldCustom
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                weekdaysOnly={workingDaysOnly}
                nonWorkingDates={nonWorkingDates}
                holidayNames={holidayNames}
                disabled={!endDateEnabled || dayType !== 'full'}
                min={startDate || undefined}
                invalid={Boolean(apiErrors.dates) && !endMissing}
                error={
                  triedSubmit && endDateEnabled && endMissing
                    ? 'Please select an end date.'
                    : null
                }
              />
              {apiErrors.dates ? (
                <div
                  className="flex gap-2 rounded-md border-2 border-status-rejected bg-status-rejected/10 px-3 py-2.5 sm:col-span-2"
                  role="alert"
                >
                  <TriangleAlert
                    className="mt-0.5 size-4 shrink-0 text-status-rejected"
                    aria-hidden="true"
                  />
                  <p className="text-small font-semibold text-status-rejected">
                    {apiErrors.dates}
                  </p>
                </div>
              ) : null}
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
                onChange={handleReasonChange}
                placeholder="Enter reason for leave"
                className="sm:col-span-2"
                rows={2}
                error={
                  triedSubmit && reasonMissing
                    ? 'Reason is required.'
                    : (apiErrors.reason ?? null)
                }
              />
              {apiErrors.form ? (
                <div
                  className="flex gap-2 rounded-md border-2 border-status-rejected bg-status-rejected/10 px-3 py-2.5 sm:col-span-2"
                  role="alert"
                >
                  <TriangleAlert
                    className="mt-0.5 size-4 shrink-0 text-status-rejected"
                    aria-hidden="true"
                  />
                  <p className="text-small font-semibold text-status-rejected">
                    {apiErrors.form}
                  </p>
                </div>
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
            loading={submitting}
            loadingText="Submitting…"
          >
            Submit Request
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
        confirmLabel="Submit"
        cancelLabel="Cancel"
        confirmVariant="primary"
        iconVariant="submit"
      />
    </div>
  )
}
