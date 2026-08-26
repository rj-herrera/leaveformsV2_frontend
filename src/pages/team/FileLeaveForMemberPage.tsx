import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { TriangleAlert } from 'lucide-react'
import type { MeGroupRef } from '../../api/auth'
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
import { useGroupMembers } from '../../hooks/api/useGroupMembers'
import { useNonWorkingHolidayDates } from '../../hooks/api/useHolidays'
import { useMemberBalances } from '../../hooks/api/useMemberBalances'
import {
  isApprovalsListKey,
  swrKeys,
} from '../../hooks/api/swrKeys'
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
  { value: '', label: 'Select Leave Type' },
  { value: VACATION_LEAVE_THEME.label, label: VACATION_LEAVE_THEME.label },
]

const EMPTY_LEAVE = {
  leaveType: '',
  dayType: '' as '' | DayType,
  startDate: '',
  endDate: '',
  reason: '',
}

function groupOptionLabel(group: MeGroupRef): string {
  return group.abbreviation?.trim() || group.name?.trim() || String(group.id)
}

function remainingLeaveLabel(available: string | undefined): string {
  if (available == null) return '0 day(s)'
  const n = Number(available)
  if (Number.isNaN(n)) return '0 day(s)'
  return `${Number.parseFloat(n.toFixed(2))} day(s)`
}

export function FileLeaveForMemberPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { mutate } = useSWRConfig()
  const toast = useToast()
  const { nonWorkingDates, holidayNames } = useNonWorkingHolidayDates()

  const [groupId, setGroupId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [leaveType, setLeaveType] = useState(EMPTY_LEAVE.leaveType)
  const [dayType, setDayType] = useState<'' | DayType>(EMPTY_LEAVE.dayType)
  const [startDate, setStartDate] = useState(EMPTY_LEAVE.startDate)
  const [endDate, setEndDate] = useState(EMPTY_LEAVE.endDate)
  const [reason, setReason] = useState(EMPTY_LEAVE.reason)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apiErrors, setApiErrors] = useState<LeaveFormApiErrors>(
    clearLeaveFormApiErrors,
  )

  const selectedGroupId = groupId === '' ? null : Number(groupId)
  const selectedEmpId = employeeId === '' ? null : Number(employeeId)

  const {
    data: members = [],
    isLoading: membersLoading,
    error: membersError,
  } = useGroupMembers(selectedGroupId)

  const { data: balances, isLoading: balancesLoading } = useMemberBalances(
    selectedEmpId,
    'VL',
  )

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedEmpId) ?? null,
    [members, selectedEmpId],
  )

  const groupOptions = useMemo(
    () =>
      user.picGroups.map((group) => ({
        value: String(group.id),
        label: groupOptionLabel(group),
      })),
    [user.picGroups],
  )

  const employeeOptions = useMemo(
    () =>
      members.map((member) => ({
        value: String(member.id),
        label: member.name,
      })),
    [members],
  )

  const leaveFieldsEnabled = selectedMember != null
  const dayTypeEnabled = leaveFieldsEnabled && leaveType !== ''
  const startDateEnabled =
    leaveFieldsEnabled && leaveType !== '' && dayType !== ''
  const endDateEnabled = startDate !== ''

  const vlBalance = useMemo(
    () => balances?.find((row) => row.code === 'VL'),
    [balances],
  )

  const remainingDays = Number(vlBalance?.available ?? NaN)
  const remainingLabel = useMemo(() => {
    if (!leaveType) return '0 day(s)'
    if (balancesLoading && vlBalance == null) return '—'
    return remainingLeaveLabel(vlBalance?.available)
  }, [balancesLoading, leaveType, vlBalance])

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
    leaveType !== '' &&
    durationDays > 0 &&
    Number.isFinite(remainingDays) &&
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

  const groupMissing = groupId === ''
  const employeeMissing = employeeId === ''
  const leaveTypeMissing = leaveType === ''
  const dayTypeMissing = dayType === ''
  const startMissing = startDate === ''
  const endMissing = endDate === ''
  const reasonMissing = reason.trim().length === 0

  const formValid =
    !groupMissing &&
    !employeeMissing &&
    selectedMember != null &&
    !leaveTypeMissing &&
    !dayTypeMissing &&
    !startMissing &&
    !endMissing &&
    !reasonMissing &&
    leadTimeValidation.ok &&
    leaveType === VACATION_LEAVE_THEME.label

  function clearApiErrors() {
    setApiErrors(clearLeaveFormApiErrors())
  }

  function resetLeaveFields() {
    setLeaveType(EMPTY_LEAVE.leaveType)
    setDayType(EMPTY_LEAVE.dayType)
    setStartDate(EMPTY_LEAVE.startDate)
    setEndDate(EMPTY_LEAVE.endDate)
    setReason(EMPTY_LEAVE.reason)
  }

  function handleGroupChange(value: string) {
    setGroupId(value)
    setEmployeeId('')
    resetLeaveFields()
    setTriedSubmit(false)
    clearApiErrors()
  }

  function handleEmployeeChange(value: string) {
    setEmployeeId(value)
    resetLeaveFields()
    clearApiErrors()
  }

  function handleLeaveTypeChange(value: string) {
    setLeaveType(value)
    setDayType(EMPTY_LEAVE.dayType)
    setStartDate(EMPTY_LEAVE.startDate)
    setEndDate(EMPTY_LEAVE.endDate)
    clearApiErrors()
  }

  function handleDayTypeChange(value: string) {
    setDayType(value as '' | DayType)
    setStartDate(EMPTY_LEAVE.startDate)
    setEndDate(EMPTY_LEAVE.endDate)
    clearApiErrors()
  }

  function handleClear() {
    setGroupId('')
    setEmployeeId('')
    resetLeaveFields()
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
    if (
      selectedEmpId == null ||
      dayType === '' ||
      leaveType !== VACATION_LEAVE_THEME.label
    ) {
      return
    }

    setConfirmOpen(false)
    setSubmitting(true)
    clearApiErrors()

    try {
      await createLeave({
        emp_id: selectedEmpId,
        start_date: startDate,
        end_date: endDate,
        day_type: dayType as ApiDayType,
        leave_reason: reason.trim(),
      })

      await Promise.all([
        mutate(swrKeys.memberBalances(selectedEmpId, 'VL')),
        mutate(swrKeys.pendingApprovals),
        mutate(isApprovalsListKey, undefined, { revalidate: true }),
      ])

      toast.success('Leave request filed for member successfully.')
      navigate('/team/leave-approvals')
    } catch (error) {
      setApiErrors(parseLeaveFormApiError(error))
    } finally {
      setSubmitting(false)
    }
  }

  function handleStartDateChange(value: string) {
    setStartDate(value)
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

  const employeeSelectDisabled =
    groupMissing || membersLoading || Boolean(membersError)

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
            <SelectField
              label="Group"
              value={groupId}
              onChange={handleGroupChange}
              placeholder="Select Group"
              options={groupOptions}
              error={
                triedSubmit && groupMissing ? 'Please select a group.' : null
              }
            />
            <SelectField
              label="Employee Name"
              value={employeeId}
              onChange={handleEmployeeChange}
              placeholder={
                membersLoading ? 'Loading employees…' : 'Select Employee'
              }
              options={employeeOptions}
              disabled={employeeSelectDisabled}
              error={
                triedSubmit && !groupMissing && employeeMissing
                  ? 'Please select an employee.'
                  : null
              }
            />
            <TextField
              label="Employee No."
              value={selectedMember ? String(selectedMember.id) : ''}
              placeholder="Employee No."
              readOnly
            />
          </div>
          {user.picGroups.length === 0 ? (
            <p className="mt-2 text-small text-text-gray">
              You are not assigned to any PIC groups.
            </p>
          ) : null}
          {membersError ? (
            <p className="mt-2 text-small text-status-rejected" role="alert">
              Unable to load members for this group. Please try again.
            </p>
          ) : null}
          {!membersLoading &&
          !membersError &&
          !groupMissing &&
          members.length === 0 ? (
            <p className="mt-2 text-small text-text-gray">
              No members you can file leave for in this group.
            </p>
          ) : null}
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
                disabled={!leaveFieldsEnabled}
                error={
                  triedSubmit && leaveFieldsEnabled && leaveTypeMissing
                    ? 'Please select a leave type.'
                    : null
                }
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
                error={
                  triedSubmit && dayTypeEnabled && dayTypeMissing
                    ? 'Please select a day type.'
                    : (apiErrors.dayType ?? null)
                }
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
                onChange={handleReasonChange}
                placeholder="Enter reason for leave"
                className="sm:col-span-2"
                rows={2}
                disabled={!leaveFieldsEnabled}
                error={
                  triedSubmit && leaveFieldsEnabled && reasonMissing
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
            disabled={!leadTimeValidation.ok}
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
