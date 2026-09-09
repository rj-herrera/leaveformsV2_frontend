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
import { FileField } from '../../components/ui/form/FileField'
import { SelectField } from '../../components/ui/form/SelectField'
import { TextAreaField } from '../../components/ui/form/TextAreaField'
import { TextField } from '../../components/ui/form/TextField'
import { QuarterlyVlLimitBanner } from '../../components/ui/QuarterlyVlLimitBanner'
import { useToast } from '../../components/ui/ToastProvider'
import { useGroupMembers } from '../../hooks/api/useGroupMembers'
import { useNonWorkingHolidayDates } from '../../hooks/api/useHolidays'
import { useLeaveQuarterUsage } from '../../hooks/api/useLeaveQuarterUsage'
import { useMemberBalances } from '../../hooks/api/useMemberBalances'
import {
  isAdminLeavesListKey,
  isApprovalsListKey,
  swrKeys,
} from '../../hooks/api/swrKeys'
import { mapApiGender } from '../../utils/gender'
import {
  clampLongLeaveEndDate,
  countLeaveDurationDays,
  fixedLeaveEndDate,
  formatDurationLabel,
  isLongLeaveEndInBounds,
  isWorkingDayISO,
  leaveEndPickerLimits,
  usesCalendarDayCounting,
  type DayType,
} from '../../utils/leaveDates'
import {
  allowsLwop,
  ATTACHMENT_MAX_FILES,
  attachmentFieldHint,
  attachmentFieldLabel,
  enforcesRemainingCredits,
  filableLeaveLabel,
  filableLeaveTypeOptionsForGender,
  hasDerivedEndDate,
  hidesRemainingCredits,
  isFilableLeaveCode,
  isFixedRangeLeave,
  isLongLeave,
  isPaternityLeave,
  isSpecialLeave,
  isSplUnavailableForLongTermOverseas,
  MED_CERT_ACCEPT,
  PATERNITY_NOTIFICATION_FORM_FILENAME,
  paternityNotificationFormHref,
  requiresAttachment,
  requiresFullDay,
  specialLeaveEndDate,
  splReasonOptionsFor,
  splSpecialLeaveReasonLabel,
  SPL_ASSIGNMENT_TYPE_OPTIONS,
  usesSplCalendarDays,
  type SplAssignmentType,
  type SplSpecialLeaveReason,
} from '../../utils/leaveFiling'
import {
  clearLeaveFormApiErrors,
  parseLeaveFormApiError,
  type LeaveFormApiErrors,
} from '../../utils/leaveFormApiErrors'
import { isQuarterUsageExceeded } from '../../utils/quarterlyVlLimit'

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
  assignmentType: '' as '' | SplAssignmentType,
  specialLeaveReason: '' as '' | SplSpecialLeaveReason,
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
  const [assignmentType, setAssignmentType] = useState<
    '' | SplAssignmentType
  >(EMPTY_LEAVE.assignmentType)
  const [specialLeaveReason, setSpecialLeaveReason] = useState<
    '' | SplSpecialLeaveReason
  >(EMPTY_LEAVE.specialLeaveReason)
  const [attachments, setAttachments] = useState<File[]>([])
  const [attachmentUploading, setAttachmentUploading] = useState(false)
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
  const needsSplDetails = isSpecialLeave(leaveType)
  const startDateEnabled =
    leaveFieldsEnabled &&
    leaveType !== '' &&
    dayType !== '' &&
    (!needsSplDetails ||
      (assignmentType !== '' && specialLeaveReason !== ''))
  const endDateEnabled = startDate !== ''
  const needsAttachment = requiresAttachment(leaveType)
  const fullDayOnly = requiresFullDay(leaveType)
  const derivedEndDate = hasDerivedEndDate(leaveType)
  const attachmentLabel = attachmentFieldLabel(leaveType)
  const selectedTypeLabel = filableLeaveLabel(leaveType)
  const leaveTypeOptions = useMemo(
    () => filableLeaveTypeOptionsForGender(mapApiGender(selectedMember?.gender)),
    [selectedMember],
  )
  const endPickerLimits = leaveEndPickerLimits(leaveType, startDate)
  const dayTypeOptions = fullDayOnly
    ? DAY_TYPE_OPTIONS.filter((option) => option.value === 'full')
    : DAY_TYPE_OPTIONS
  const splReasonOptions = splReasonOptionsFor(assignmentType)
  const splCalendarDays = usesSplCalendarDays(
    assignmentType,
    specialLeaveReason,
  )

  const selectedBalance = useMemo(
    () =>
      leaveType
        ? balances?.find(
            (row) => row.code.toUpperCase() === leaveType.toUpperCase(),
          )
        : undefined,
    [balances, leaveType],
  )

  const remainingDays = Number(selectedBalance?.available ?? NaN)
  const remainingLabel = useMemo(() => {
    if (!leaveType) return '0 day(s)'
    if (hidesRemainingCredits(leaveType)) return '—'
    if (balancesLoading && selectedBalance == null) return '—'
    return remainingLeaveLabel(selectedBalance?.available)
  }, [balancesLoading, leaveType, selectedBalance])

  const leaveDuration = useMemo(() => {
    if (!startDate || !endDate) return 0
    if (dayType === 'half_am' || dayType === 'half_pm') return 0.5
    if (dayType !== 'full') return 0
    return countLeaveDurationDays(
      leaveType,
      startDate,
      endDate,
      nonWorkingDates,
      { calendarDays: splCalendarDays },
    )
  }, [
    dayType,
    startDate,
    endDate,
    leaveType,
    nonWorkingDates,
    splCalendarDays,
  ])

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

  const { data: quarterUsage } = useLeaveQuarterUsage({
    enabled: selectedEmpId != null,
    code: leaveType,
    startDate,
    endDate,
    dayType,
    empId: selectedEmpId,
  })
  const quarterUsageExceeded = isQuarterUsageExceeded(quarterUsage)

  const exceedsCredits =
    leaveType !== '' &&
    enforcesRemainingCredits(leaveType) &&
    durationDays > 0 &&
    Number.isFinite(remainingDays) &&
    durationDays > remainingDays
  const noCredits =
    leaveType !== '' &&
    enforcesRemainingCredits(leaveType) &&
    Number.isFinite(remainingDays) &&
    remainingDays <= 0
  /** VL/SL with 0 available credits — filing still allowed; recorded as full LWOP. */
  const willBeFullLwop =
    leaveType !== '' &&
    allowsLwop(leaveType) &&
    Number.isFinite(remainingDays) &&
    remainingDays <= 0
  const mayBeLwop =
    leaveType !== '' &&
    allowsLwop(leaveType) &&
    !willBeFullLwop &&
    durationDays > 0 &&
    Number.isFinite(remainingDays) &&
    durationDays > remainingDays

  const workingDaysOnly = needsSplDetails
    ? !splCalendarDays
    : leaveType !== '' && !usesCalendarDayCounting(leaveType)

  const groupMissing = groupId === ''
  const employeeMissing = employeeId === ''
  const leaveTypeMissing = leaveType === ''
  const dayTypeMissing = dayType === ''
  const startMissing = startDate === ''
  const endMissing = endDate === ''
  const reasonMissing = !needsSplDetails && reason.trim().length === 0
  const attachmentMissing = needsAttachment && attachments.length === 0
  const assignmentTypeMissing = needsSplDetails && assignmentType === ''
  const specialLeaveReasonMissing =
    needsSplDetails && specialLeaveReason === ''

  const longLeaveRangeInvalid =
    isLongLeave(leaveType) &&
    startDate !== '' &&
    endDate !== '' &&
    !isLongLeaveEndInBounds(startDate, endDate)

  const formValid =
    !groupMissing &&
    !employeeMissing &&
    selectedMember != null &&
    !leaveTypeMissing &&
    isFilableLeaveCode(leaveType) &&
    !dayTypeMissing &&
    !startMissing &&
    !endMissing &&
    !reasonMissing &&
    !attachmentMissing &&
    !assignmentTypeMissing &&
    !specialLeaveReasonMissing &&
    !attachmentUploading &&
    !exceedsCredits &&
    !noCredits &&
    !longLeaveRangeInvalid

  function clearApiErrors() {
    setApiErrors(clearLeaveFormApiErrors())
  }

  function resetLeaveFields() {
    setLeaveType(EMPTY_LEAVE.leaveType)
    setDayType(EMPTY_LEAVE.dayType)
    setStartDate(EMPTY_LEAVE.startDate)
    setEndDate(EMPTY_LEAVE.endDate)
    setReason(EMPTY_LEAVE.reason)
    setAssignmentType(EMPTY_LEAVE.assignmentType)
    setSpecialLeaveReason(EMPTY_LEAVE.specialLeaveReason)
    setAttachments([])
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
    setDayType(requiresFullDay(value) ? 'full' : EMPTY_LEAVE.dayType)
    setStartDate(EMPTY_LEAVE.startDate)
    setEndDate(EMPTY_LEAVE.endDate)
    setAssignmentType(EMPTY_LEAVE.assignmentType)
    setSpecialLeaveReason(EMPTY_LEAVE.specialLeaveReason)
    setAttachments([])
    clearApiErrors()
  }

  function applySplMatrix(
    nextAssignment: '' | SplAssignmentType,
    nextReason: '' | SplSpecialLeaveReason,
    nextStart = startDate,
  ) {
    let start = nextStart
    if (
      start &&
      nextAssignment &&
      nextReason &&
      !usesSplCalendarDays(nextAssignment, nextReason) &&
      !isWorkingDayISO(start, nonWorkingDates)
    ) {
      start = EMPTY_LEAVE.startDate
    }
    if (start !== startDate) setStartDate(start)
    setEndDate(
      start
        ? specialLeaveEndDate(
            start,
            nextAssignment,
            nextReason,
            nonWorkingDates,
          )
        : EMPTY_LEAVE.endDate,
    )
  }

  function handleAssignmentTypeChange(value: string) {
    const next = value as '' | SplAssignmentType
    const nextReason =
      specialLeaveReason !== '' &&
      next === 'long_term_overseas' &&
      isSplUnavailableForLongTermOverseas(specialLeaveReason)
        ? ''
        : specialLeaveReason
    setAssignmentType(next)
    if (nextReason !== specialLeaveReason) {
      setSpecialLeaveReason(nextReason)
    }
    applySplMatrix(next, nextReason)
    if (
      apiErrors.assignmentType ||
      apiErrors.specialLeaveReason ||
      apiErrors.form
    ) {
      clearApiErrors()
    }
  }

  function handleSpecialLeaveReasonChange(value: string) {
    const next = value as '' | SplSpecialLeaveReason
    setSpecialLeaveReason(next)
    applySplMatrix(assignmentType, next)
    if (apiErrors.specialLeaveReason || apiErrors.form) clearApiErrors()
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
    if (selectedEmpId == null || dayType === '' || !isFilableLeaveCode(leaveType)) {
      return
    }
    if (needsAttachment && attachments.length === 0) return
    if (
      needsSplDetails &&
      (assignmentType === '' || specialLeaveReason === '')
    ) {
      return
    }

    setConfirmOpen(false)
    setSubmitting(true)
    clearApiErrors()

    try {
      await createLeave({
        emp_id: selectedEmpId,
        code: leaveType,
        start_date: startDate,
        end_date: endDate,
        day_type: dayType as ApiDayType,
        leave_reason: needsSplDetails
          ? splSpecialLeaveReasonLabel(specialLeaveReason)
          : reason.trim(),
        ...(needsSplDetails
          ? {
              assignment_type: assignmentType,
              special_leave_reason: specialLeaveReason,
            }
          : {}),
        ...(needsAttachment && attachments.length > 0
          ? { leave_attachment: attachments }
          : {}),
      })

      await Promise.all([
        mutate(swrKeys.memberBalances(selectedEmpId)),
        mutate(swrKeys.pendingApprovals),
        mutate(isApprovalsListKey, undefined, { revalidate: true }),
        mutate(isAdminLeavesListKey, undefined, { revalidate: true }),
      ])

      toast.success(
        needsAttachment
          ? 'Leave request filed for member. Admin will review the attachment.'
          : 'Leave request filed for member successfully.',
      )
      navigate('/team/leave-approvals')
    } catch (error) {
      setApiErrors(parseLeaveFormApiError(error))
    } finally {
      setSubmitting(false)
    }
  }

  function handleStartDateChange(value: string) {
    setStartDate(value)
    if (isFixedRangeLeave(leaveType)) {
      setEndDate(fixedLeaveEndDate(leaveType, value, nonWorkingDates))
    } else if (needsSplDetails) {
      setEndDate(
        specialLeaveEndDate(
          value,
          assignmentType,
          specialLeaveReason,
          nonWorkingDates,
        ),
      )
    } else if (isLongLeave(leaveType)) {
      setEndDate(clampLongLeaveEndDate(value, endDate))
    } else if (dayType !== 'full' || !endDate || value > endDate) {
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
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
      >
        <h1 className="shrink-0 text-h1 text-text-black">
          File Leave for Member
        </h1>

        <section className="shrink-0 rounded-lg border border-border bg-surface px-4 py-3 sm:px-5">
          <h2 className="text-h2 text-text-black">Employee Information</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <SelectField
              className="sm:col-span-1"
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
              className="sm:col-span-2"
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
              className="sm:col-span-1"
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

        <section className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
          <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-h2 text-text-black">Leave Information</h2>
          </div>
          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-4">
            <div className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2">
              <SelectField
                label="Leave Type"
                value={leaveType}
                onChange={handleLeaveTypeChange}
                placeholder="Select Leave Type"
                options={leaveTypeOptions}
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
              {needsSplDetails ? (
                <>
                  <SelectField
                    label="Assignment Type"
                    value={assignmentType}
                    onChange={handleAssignmentTypeChange}
                    placeholder="Select Assignment Type"
                    options={[...SPL_ASSIGNMENT_TYPE_OPTIONS]}
                    disabled={!leaveFieldsEnabled}
                    error={
                      triedSubmit && assignmentTypeMissing
                        ? 'Please select an assignment type.'
                        : (apiErrors.assignmentType ?? null)
                    }
                  />
                  <SelectField
                    label="Qualifying Event / Relationship"
                    value={specialLeaveReason}
                    onChange={handleSpecialLeaveReasonChange}
                    placeholder="Select Qualifying Event / Relationship"
                    options={[...splReasonOptions]}
                    disabled={!leaveFieldsEnabled || assignmentType === ''}
                    error={
                      triedSubmit && specialLeaveReasonMissing
                        ? 'Please select a qualifying event / relationship.'
                        : (apiErrors.specialLeaveReason ?? null)
                    }
                  />
                </>
              ) : null}
              <SelectField
                label="Day Type"
                value={dayType}
                onChange={handleDayTypeChange}
                placeholder="Select Day Type"
                options={[...dayTypeOptions]}
                disabled={!dayTypeEnabled || fullDayOnly}
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
                disabled={!endDateEnabled || dayType !== 'full' || derivedEndDate}
                min={endPickerLimits.min}
                max={endPickerLimits.max}
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
              {leaveType === 'VL' ? (
                <QuarterlyVlLimitBanner
                  usage={quarterUsage}
                  className="sm:col-span-2"
                />
              ) : null}
              {noCredits ? (
                <div
                  className="flex items-start gap-3 rounded-md border-2 border-status-pending bg-status-pending/15 px-3 py-3 sm:col-span-2"
                  role="alert"
                >
                  <TriangleAlert
                    className="mt-0.5 size-5 shrink-0 text-status-pending"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-body font-semibold text-text-black">
                      No remaining {selectedTypeLabel} credits
                    </p>
                    <p className="mt-1 text-small text-text-black">
                      You cannot file {selectedTypeLabel} without available
                      credits.
                    </p>
                  </div>
                </div>
              ) : exceedsCredits ? (
                <div
                  className="flex items-start gap-3 rounded-md border-2 border-status-pending bg-status-pending/15 px-3 py-3 sm:col-span-2"
                  role="alert"
                >
                  <TriangleAlert
                    className="mt-0.5 size-5 shrink-0 text-status-pending"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-body font-semibold text-text-black">
                      Insufficient {selectedTypeLabel} credits
                    </p>
                    <p className="mt-1 text-small text-text-black">
                      Duration exceeds remaining credits. Shorten the leave, or
                      file remaining days as Vacation Leave.
                    </p>
                  </div>
                </div>
              ) : willBeFullLwop ? (
                <div
                  className="flex items-start gap-3 rounded-md border-2 border-status-pending bg-status-pending/15 px-3 py-3 sm:col-span-2"
                  role="status"
                >
                  <TriangleAlert
                    className="mt-0.5 size-5 shrink-0 text-status-pending"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-body font-semibold text-text-black">
                      No remaining {selectedTypeLabel} credits
                    </p>
                    <p className="mt-1 text-small text-text-black">
                      This request will be filed as Leave Without Pay (LWOP).
                    </p>
                  </div>
                </div>
              ) : mayBeLwop ? (
                <div
                  className="flex items-start gap-3 rounded-md border-2 border-status-pending bg-status-pending/15 px-3 py-3 sm:col-span-2"
                  role="status"
                >
                  <TriangleAlert
                    className="mt-0.5 size-5 shrink-0 text-status-pending"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-body font-semibold text-text-black">
                      Insufficient leave credits
                    </p>
                    <p className="mt-1 text-small text-text-black">
                      Duration ({durationLabel}) exceeds remaining{' '}
                      {remainingLabel}. Excess days may be treated as LWOP.
                    </p>
                  </div>
                </div>
              ) : null}
              {needsSplDetails ? (
                <TextField
                  label="Reason"
                  value={splSpecialLeaveReasonLabel(specialLeaveReason)}
                  readOnly
                  className="sm:col-span-2"
                />
              ) : (
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
              )}
              {needsAttachment ? (
                <FileField
                  label={attachmentLabel}
                  files={attachments}
                  onChange={(files) => {
                    setAttachments(files)
                    if (apiErrors.attachment || apiErrors.form) {
                      clearApiErrors()
                    }
                  }}
                  onUploadingChange={setAttachmentUploading}
                  accept={MED_CERT_ACCEPT}
                  required
                  maxFiles={ATTACHMENT_MAX_FILES}
                  disabled={!leaveFieldsEnabled}
                  className="sm:col-span-2"
                  hint={attachmentFieldHint()}
                  {...(isPaternityLeave(leaveType)
                    ? {
                        labelDownloadHref: paternityNotificationFormHref(),
                        labelDownloadFileName:
                          PATERNITY_NOTIFICATION_FORM_FILENAME,
                        labelDownloadTooltip:
                          'Download the Paternity Notification Form to fill out and submit as required.',
                      }
                    : {})}
                  error={
                    triedSubmit && leaveFieldsEnabled && attachmentMissing
                      ? `${attachmentLabel} is required for this leave type.`
                      : (apiErrors.attachment ?? null)
                  }
                />
              ) : null}
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
            disabled={attachmentUploading}
            loading={submitting}
            loadingText="Submitting…"
            title={
              attachmentUploading
                ? 'Wait for the attachment upload to finish.'
                : undefined
            }
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
        title={
          quarterUsageExceeded
            ? 'Submit leave and notify admin?'
            : 'Confirm leave request'
        }
        description={
          quarterUsageExceeded ? (
            <>
              This Vacation Leave for{' '}
              <span className="font-semibold text-primary">
                {selectedMember?.name ?? 'the selected employee'}
              </span>{' '}
              would exceed the <span className="font-semibold">9-day</span>{' '}
              quarterly cap and may result in a memo. Admin will be notified.
              Submit anyway?
            </>
          ) : (
            <>
              Submit this leave request on behalf of{' '}
              <span className="font-semibold text-primary">
                {selectedMember?.name ?? 'the selected employee'}
              </span>
              ?
            </>
          )
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
