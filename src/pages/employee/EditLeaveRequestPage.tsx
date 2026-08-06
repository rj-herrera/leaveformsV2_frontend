import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { DateFieldCustom } from '../../components/ui/form/DateFieldCustom'
import { SelectField } from '../../components/ui/form/SelectField'
import { TextAreaField } from '../../components/ui/form/TextAreaField'
import { TextField } from '../../components/ui/form/TextField'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import { FormPageLoadingView } from '../../components/ui/Skeleton'
import {
  getSelectableLeaveThemes,
  SICK_LEAVE_THEME,
  VACATION_LEAVE_THEME,
} from '../../constants/leaveTypeTheme'
import { shouldShowDataSkeleton } from '../../mocks/config'
import { getLeaveRequestDetail } from '../../mocks/leaveRequests'
import {
  countLeaveDurationDays,
  formatDurationLabel,
  inferDayTypeFromDuration,
  parseLeavePeriodToDates,
  snapToWorkingDay,
  todayISO,
  usesCalendarDayCounting,
  type DayType,
} from '../../utils/leaveDates'
import { validateLeaveLeadTime } from '../../utils/leaveLeadTime'

const DAY_TYPE_OPTIONS = [
  { value: 'full', label: 'Whole day' },
  { value: 'half_am', label: 'Half day (AM)' },
  { value: 'half_pm', label: 'Half day (PM)' },
] as const

export function EditLeaveRequestPage() {
  const { leaveRequestId } = useParams<{ leaveRequestId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const detail = getLeaveRequestDetail(leaveRequestId)
  const showSkeleton = shouldShowDataSkeleton()

  const parentalLabel =
    user.gender === 'female' ? 'Maternity Leave' : 'Paternity Leave'

  const leaveTypeOptions = useMemo(() => {
    const selectable = getSelectableLeaveThemes(parentalLabel, user.gender)
    return [
      { value: VACATION_LEAVE_THEME.label, label: VACATION_LEAVE_THEME.label },
      { value: SICK_LEAVE_THEME.label, label: SICK_LEAVE_THEME.label },
      {
        value: selectable.emergency.label,
        label: selectable.emergency.label,
      },
      { value: selectable.ptb.label, label: selectable.ptb.label },
      {
        value: selectable.parental.label,
        label: selectable.parental.label,
      },
    ]
  }, [parentalLabel, user.gender])

  const initialDates = useMemo(() => {
    if (!detail) {
      return { start: '', end: '' }
    }
    const parsed = parseLeavePeriodToDates(
      detail.leavePeriod,
      detail.filedOnDate,
    )
    if (usesCalendarDayCounting(detail.leaveType)) {
      return { start: parsed.start, end: parsed.end }
    }
    const start = snapToWorkingDay(parsed.start, 'forward')
    let end = snapToWorkingDay(parsed.end, 'backward')
    if (end < start) {
      end = start
    }
    return { start, end }
  }, [detail])

  const [leaveType, setLeaveType] = useState(
    () => detail?.leaveType ?? VACATION_LEAVE_THEME.label,
  )
  const [dayType, setDayType] = useState<DayType>(() =>
    detail ? inferDayTypeFromDuration(detail.duration) : 'full',
  )
  const [startDate, setStartDate] = useState(() => initialDates.start)
  const [endDate, setEndDate] = useState(() => initialDates.end)
  const [reason, setReason] = useState(() => detail?.reason ?? '')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  const leaveDuration = useMemo(() => {
    if (dayType !== 'full') return 0.5
    return countLeaveDurationDays(leaveType, startDate, endDate)
  }, [dayType, startDate, endDate, leaveType])

  const durationLabel = useMemo(
    () => formatDurationLabel(leaveDuration, dayType),
    [leaveDuration, dayType],
  )

  const leadTimeValidation = useMemo(
    () =>
      validateLeaveLeadTime({
        dayType,
        weekdayDuration: dayType === 'full' ? leaveDuration : 0,
        startDateISO: startDate,
        filedOnISO: todayISO(),
      }),
    [dayType, leaveDuration, startDate],
  )

  const workingDaysOnly = !usesCalendarDayCounting(leaveType)

  if (showSkeleton) {
    return (
      <FormPageLoadingView
        backTo="/dashboard"
        backLabel="Back to Dashboard"
        title="Edit Leave Request"
        sections={[
          {
            heading: 'Employee Information',
            fields: [
              { label: 'Employee No.' },
              { label: 'Name' },
            ],
          },
          {
            heading: 'Leave Information',
            fields: [
              { label: 'Leave Type' },
              { label: 'Day Type' },
              { label: 'Start Date' },
              { label: 'End Date' },
              { label: 'Duration', span: 2 },
              { label: 'Reason', span: 2 },
            ],
          },
        ]}
      />
    )
  }

  if (!detail) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <Link
          to="/dashboard"
          className="text-body inline-flex w-fit items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Dashboard
        </Link>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h1 className="text-h1 text-text-black">Leave request not found</h1>
          <p className="mt-2 text-body text-text-gray">
            No mock details exist for ID{' '}
            <span className="font-semibold text-text-black">
              {leaveRequestId ?? 'unknown'}
            </span>
            .
          </p>
        </div>
      </div>
    )
  }

  const requestId = detail.id
  const detailsPath = `/my-leave/requests/${requestId}`

  function handleCancel() {
    navigate(detailsPath)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!leadTimeValidation.ok) return
    setConfirmOpen(true)
  }

  function handleConfirmEdit() {
    // TODO(REPLACE): PUT/PATCH leave request via API
    setConfirmOpen(false)
    setSuccessOpen(true)
  }

  function handleSuccessClose() {
    setSuccessOpen(false)
    navigate(detailsPath)
  }

  function handleStartDateChange(value: string) {
    setStartDate(value)
    if (!endDate || value > endDate) {
      setEndDate(value)
    }
  }

  function handleEndDateChange(value: string) {
    setEndDate(value)
    if (startDate && value < startDate) {
      setStartDate(value)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <Link
        to={detailsPath}
        className="text-body inline-flex w-fit shrink-0 items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Leave Request
      </Link>

      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
      >
        <h1 className="shrink-0 text-h1 text-text-black">Edit Leave Request</h1>

        <section className="shrink-0 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-h2 text-text-black">Employee Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField
              label="Employee No."
              value={user.employeeNumber}
              readOnly
            />
            <TextField label="Name" value={user.name} readOnly />
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
          <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-h2 text-text-black">Leave Information</h2>
          </div>
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-3 sm:px-4">
            <div className="grid min-w-0 grid-cols-1 content-start gap-3 sm:grid-cols-2 sm:gap-4">
              <SelectField
                label="Leave Type"
                value={leaveType}
                onChange={setLeaveType}
                placeholder="Select Leave Type"
                options={leaveTypeOptions}
              />
              <SelectField
                label="Day Type"
                value={dayType}
                onChange={(value) => setDayType(value as DayType)}
                placeholder="Select Day Type"
                options={[...DAY_TYPE_OPTIONS]}
              />
              <DateFieldCustom
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                weekdaysOnly={workingDaysOnly}
                max={endDate || undefined}
              />
              <DateFieldCustom
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                weekdaysOnly={workingDaysOnly}
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
                  className={`rounded-md border-2 px-3 py-3 sm:col-span-2 ${
                    leadTimeValidation.ok
                      ? 'border-status-pending bg-status-pending/15'
                      : 'border-status-rejected bg-status-rejected/10'
                  }`}
                  role="alert"
                >
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
              ) : null}
              <TextAreaField
                label="Reason"
                value={reason}
                onChange={setReason}
                placeholder="Enter reason for leave"
                className="sm:col-span-2"
                rows={3}
              />
            </div>
          </div>
        </section>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button type="button" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!leadTimeValidation.ok}
          >
            Confirm
          </Button>
        </div>
      </form>

      <ConfirmReasonModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmEdit}
        title="Confirm leave request edit"
        description="Are you sure you want to save these changes to the leave request?"
        requireReason={false}
        confirmLabel="Save changes"
        cancelLabel="Go back"
        confirmVariant="primary"
      />

      <SuccessDialog
        open={successOpen}
        onClose={handleSuccessClose}
        title="Changes saved"
        message="Your leave request has been updated successfully."
        confirmLabel="Back to request"
      />
    </div>
  )
}
