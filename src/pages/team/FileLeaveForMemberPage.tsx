import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { DateFieldCustom } from '../../components/ui/form/DateFieldCustom'
import { FileField } from '../../components/ui/form/FileField'
import { SelectField } from '../../components/ui/form/SelectField'
import { TextAreaField } from '../../components/ui/form/TextAreaField'
import { TextField } from '../../components/ui/form/TextField'
import { useToast } from '../../components/ui/ToastProvider'
import {
  getSelectableLeaveThemes,
  SICK_LEAVE_THEME,
  VACATION_LEAVE_THEME,
} from '../../constants/leaveTypeTheme'
import {
  PARENTAL_CREDITS_REQUIRES_REQUEST_MESSAGE,
  isParentalLeaveType,
} from '../../mocks/leaveBalances'
import { canViewParentalLeaveCredits } from '../../mocks/leaveRequests'
import {
  getRemainingLeaveDays,
  getRemainingLeaveLabel,
  getTeamMemberById,
  getTeamMembersForApprover,
  submitProxyLeaveRequest,
} from '../../mocks/teamMembers'
import { useNonWorkingHolidayDates } from '../../hooks/api/useHolidays'
import {
  countLeaveDurationDays,
  formatDurationLabel,
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

const EMPTY_LEAVE = {
  leaveType: '',
  dayType: '' as '' | DayType,
  startDate: '',
  endDate: '',
  reason: '',
}

function isAttachmentRequired(leaveType: string): boolean {
  return leaveType !== '' && leaveType !== VACATION_LEAVE_THEME.label
}

export function FileLeaveForMemberPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const { nonWorkingDates, holidayNames } = useNonWorkingHolidayDates()

  const teamMembers = useMemo(
    () => getTeamMembersForApprover(user.id),
    [user.id],
  )

  const [employeeId, setEmployeeId] = useState('')
  const [leaveType, setLeaveType] = useState(EMPTY_LEAVE.leaveType)
  const [dayType, setDayType] = useState<'' | DayType>(EMPTY_LEAVE.dayType)
  const [startDate, setStartDate] = useState(EMPTY_LEAVE.startDate)
  const [endDate, setEndDate] = useState(EMPTY_LEAVE.endDate)
  const [reason, setReason] = useState(EMPTY_LEAVE.reason)
  const [attachments, setAttachments] = useState<File[]>([])
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const selectedMember = useMemo(
    () => (employeeId ? getTeamMemberById(employeeId) : null),
    [employeeId],
  )

  const parentalLabel =
    selectedMember?.gender === 'female'
      ? 'Maternity Leave'
      : 'Paternity Leave'

  const leaveTypeOptions = useMemo(() => {
    const gender = selectedMember?.gender ?? 'male'
    const selectable = getSelectableLeaveThemes(parentalLabel, gender)
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
  }, [parentalLabel, selectedMember?.gender])

  const employeeOptions = useMemo(
    () => [
      ...teamMembers.map((member) => ({
        value: member.id,
        label: member.name,
      })),
    ],
    [teamMembers],
  )

  const attachmentRequired = isAttachmentRequired(leaveType)
  const leaveFieldsEnabled = employeeId !== ''
  const dayTypeEnabled = leaveFieldsEnabled && leaveType !== ''
  const startDateEnabled =
    leaveFieldsEnabled && leaveType !== '' && dayType !== ''
  const endDateEnabled = startDate !== ''

  const remainingDays = useMemo(
    () => getRemainingLeaveDays(employeeId, leaveType),
    [employeeId, leaveType],
  )

  const parentalCreditsLocked =
    employeeId !== '' &&
    isParentalLeaveType(leaveType) &&
    !canViewParentalLeaveCredits(employeeId, leaveType)

  const remainingLabel = useMemo(() => {
    if (!leaveType) return '0 day(s)'
    if (parentalCreditsLocked) return 'Unavailable'
    return getRemainingLeaveLabel(employeeId, leaveType)
  }, [employeeId, leaveType, parentalCreditsLocked])

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

  const durationDays = useMemo(() => {
    if (dayType === 'half_am' || dayType === 'half_pm') return 0.5
    if (dayType === 'full') return leaveDuration
    return 0
  }, [dayType, leaveDuration])

  const durationLabel = useMemo(() => {
    if (!dayType || (!startDate && !endDate)) return '0 day(s)'
    if (dayType === 'half_am' || dayType === 'half_pm') {
      return formatDurationLabel(0.5, dayType)
    }
    return formatDurationLabel(leaveDuration, 'full')
  }, [dayType, startDate, endDate, leaveDuration])

  const mayBeLwop =
    !parentalCreditsLocked &&
    leaveType !== '' &&
    durationDays > 0 &&
    remainingDays >= 0 &&
    durationDays > remainingDays

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

  const employeeMissing = employeeId === ''
  const leaveTypeMissing = leaveType === ''
  const dayTypeMissing = dayType === ''
  const startMissing = startDate === ''
  const endMissing = endDate === ''
  const reasonMissing = reason.trim().length === 0
  const attachmentMissing = attachmentRequired && attachments.length === 0

  const formValid =
    !employeeMissing &&
    !leaveTypeMissing &&
    !dayTypeMissing &&
    !startMissing &&
    !endMissing &&
    !reasonMissing &&
    !attachmentMissing &&
    !attachmentUploading &&
    leadTimeValidation.ok

  function resetLeaveFields() {
    setLeaveType(EMPTY_LEAVE.leaveType)
    setDayType(EMPTY_LEAVE.dayType)
    setStartDate(EMPTY_LEAVE.startDate)
    setEndDate(EMPTY_LEAVE.endDate)
    setReason(EMPTY_LEAVE.reason)
    setAttachments([])
    setAttachmentUploading(false)
  }

  function handleEmployeeChange(value: string) {
    setEmployeeId(value)
    resetLeaveFields()
  }

  function handleLeaveTypeChange(value: string) {
    setLeaveType(value)
    setDayType(EMPTY_LEAVE.dayType)
    setStartDate(EMPTY_LEAVE.startDate)
    setEndDate(EMPTY_LEAVE.endDate)
    if (!isAttachmentRequired(value)) {
      setAttachments([])
      setAttachmentUploading(false)
    }
  }

  function handleDayTypeChange(value: string) {
    setDayType(value as '' | DayType)
    setStartDate(EMPTY_LEAVE.startDate)
    setEndDate(EMPTY_LEAVE.endDate)
  }

  function handleClear() {
    setEmployeeId('')
    resetLeaveFields()
    setTriedSubmit(false)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTriedSubmit(true)
    if (!formValid) return
    setConfirmOpen(true)
  }

  function handleConfirmSubmit() {
    // TODO(REPLACE): POST proxy leave request via API
    if (!selectedMember) return

    submitProxyLeaveRequest({
      filedOnBehalfOf: {
        id: selectedMember.id,
        name: selectedMember.name,
        employeeNumber: selectedMember.employeeNumber,
      },
      filedBy: {
        id: user.id,
        name: user.name,
      },
      submittedAt: new Date().toISOString(),
      leaveType,
      dayType,
      startDate,
      endDate,
      duration: durationLabel,
      remainingLeave: remainingLabel,
      reason: reason.trim(),
      attachmentFileName:
        attachments.length > 0
          ? attachments.map((file) => file.name).join(', ')
          : null,
    })

    setConfirmOpen(false)
    toast.success('Leave request filed for member successfully.')
    navigate('/team/leave-approvals')
  }

  function handleStartDateChange(value: string) {
    setStartDate(value)
    // Keep end in range: first pick, half-day, or start moved past end.
    if (dayType !== 'full' || !endDate || value > endDate) {
      setEndDate(value)
    }
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
        <h1 className="shrink-0 text-h1 text-text-black">
          File Leave for Member
        </h1>

        <section className="shrink-0 overflow-visible rounded-lg border border-border bg-surface px-4 py-3 sm:px-5">
          <h2 className="text-h2 text-text-black">Employee Information</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TextField
              label="Employee No."
              value={selectedMember?.employeeNumber ?? ''}
              placeholder="Employee No."
              readOnly
            />
            <SelectField
              label="Employee Name"
              value={employeeId}
              onChange={handleEmployeeChange}
              placeholder="Select Employee"
              options={employeeOptions}
            />
          </div>
          {triedSubmit && employeeMissing ? (
            <p className="mt-2 text-small text-status-rejected" role="alert">
              Please select an employee.
            </p>
          ) : null}
        </section>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
          <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-h2 text-text-black">Leave Information</h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
            <div className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2">
              <SelectField
                label="Leave Type"
                value={leaveType}
                onChange={handleLeaveTypeChange}
                placeholder="Select Leave Type"
                options={leaveTypeOptions}
                disabled={!leaveFieldsEnabled}
              />
              <TextField
                label="Remaining Leave"
                value={remainingLabel}
                readOnly
              />
              <SelectField
                label="Day Type"
                value={dayType}
                onChange={handleDayTypeChange}
                placeholder="Select Day Type"
                options={[...DAY_TYPE_OPTIONS]}
                disabled={!dayTypeEnabled}
              />
              <TextField label="Duration" value={durationLabel} readOnly />
              <DateFieldCustom
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                weekdaysOnly={workingDaysOnly}
                nonWorkingDates={nonWorkingDates}
                holidayNames={holidayNames}
                disabled={!startDateEnabled}
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
              />
              {parentalCreditsLocked ? (
                <div
                  className="rounded-md border border-status-pending/50 bg-status-pending/10 px-3 py-2.5 sm:col-span-2"
                  role="status"
                >
                  <p className="text-small font-semibold text-text-black">
                    Credits not available yet
                  </p>
                  <p className="mt-1 text-small text-text-black">
                    {PARENTAL_CREDITS_REQUIRES_REQUEST_MESSAGE}
                  </p>
                </div>
              ) : null}
              {mayBeLwop ? (
                <div
                  className="rounded-md border border-status-pending/50 bg-status-pending/10 px-3 py-2.5 sm:col-span-2"
                  role="status"
                >
                  <p className="text-small font-semibold text-text-black">
                    Insufficient leave credits
                  </p>
                  <p className="mt-1 text-small text-text-black">
                    Duration ({durationLabel}) exceeds remaining{' '}
                    {remainingLabel}. Excess days may be treated as LWOP.
                  </p>
                </div>
              ) : null}
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
                disabled={!leaveFieldsEnabled}
              />
              {triedSubmit && reasonMissing ? (
                <p
                  className="-mt-1 text-small text-status-rejected sm:col-span-2"
                  role="alert"
                >
                  Reason is required.
                </p>
              ) : null}
              {attachmentRequired ? (
                <FileField
                  label="Supporting attachment"
                  files={attachments}
                  onChange={setAttachments}
                  onUploadingChange={setAttachmentUploading}
                  accept="image/*,.pdf"
                  required
                  multiple
                  maxFiles={5}
                  className="sm:col-span-2"
                  hint="Required for this leave type (e.g. medical certificate or supporting document). You can attach up to 5 files."
                  error={
                    triedSubmit && attachmentMissing
                      ? 'An attachment is required for this leave type.'
                      : null
                  }
                />
              ) : null}
              {triedSubmit &&
              leaveFieldsEnabled &&
              (leaveTypeMissing ||
                dayTypeMissing ||
                startMissing ||
                endMissing) ? (
                <p
                  className="text-small text-status-rejected sm:col-span-2"
                  role="alert"
                >
                  Please complete Leave Type, Day Type, Start Date, and End
                  Date.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button type="button" onClick={handleClear}>
            Clear
          </Button>
          <Button type="submit" variant="primary">
            Submit Request
          </Button>
        </div>
      </form>

      <ConfirmReasonModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirm Leave Request"
        description={
          <>
            Submit this leave request on behalf of{' '}
            <span className="font-semibold text-primary">
              {selectedMember?.name ?? 'the selected employee'}
            </span>
            ?
          </>
        }
        requireReason={false}
        confirmLabel="Submit"
        cancelLabel="Cancel"
        confirmVariant="primary"
        iconVariant="submit"
      />
    </div>
  )
}
