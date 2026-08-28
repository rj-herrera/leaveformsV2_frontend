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
import { useToast } from '../../components/ui/ToastProvider'
import { useGroupMembers } from '../../hooks/api/useGroupMembers'
import { useNonWorkingHolidayDates } from '../../hooks/api/useHolidays'
import { useMemberBalances } from '../../hooks/api/useMemberBalances'
import {
  isAdminLeavesListKey,
  isApprovalsListKey,
  swrKeys,
} from '../../hooks/api/swrKeys'
import { mapApiGender } from '../../utils/gender'
import {
  countLeaveDurationDays,
  fixedLeaveEndDate,
  formatDurationLabel,
  todayISO,
  usesCalendarDayCounting,
  type DayType,
} from '../../utils/leaveDates'
import {
  allowsLwop,
  appliesVlLeadTime,
  ATTACHMENT_MAX_FILES,
  attachmentFieldHint,
  attachmentFieldLabel,
  enforcesRemainingCredits,
  filableLeaveLabel,
  filableLeaveTypeOptionsForGender,
  grantsCreditsOnSubmit,
  isFilableLeaveCode,
  isFixedRangeLeave,
  MED_CERT_ACCEPT,
  requiresAttachment,
  requiresFullDay,
} from '../../utils/leaveFiling'
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
  const startDateEnabled =
    leaveFieldsEnabled && leaveType !== '' && dayType !== ''
  const endDateEnabled = startDate !== ''
  const needsAttachment = requiresAttachment(leaveType)
  const fullDayOnly = requiresFullDay(leaveType)
  const fixedRange = isFixedRangeLeave(leaveType)
  const attachmentLabel = attachmentFieldLabel(leaveType)
  const selectedTypeLabel = filableLeaveLabel(leaveType)
  const leaveTypeOptions = useMemo(
    () => filableLeaveTypeOptionsForGender(mapApiGender(selectedMember?.gender)),
    [selectedMember],
  )
  const dayTypeOptions = fullDayOnly
    ? DAY_TYPE_OPTIONS.filter((option) => option.value === 'full')
    : DAY_TYPE_OPTIONS

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
    if (grantsCreditsOnSubmit(leaveType)) return '—'
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
  const mayBeLwop =
    leaveType !== '' &&
    allowsLwop(leaveType) &&
    durationDays > 0 &&
    Number.isFinite(remainingDays) &&
    durationDays > remainingDays

  const leadTimeValidation = useMemo(() => {
    if (!appliesVlLeadTime(leaveType)) {
      return { ok: true, isLongLeave: false, message: null }
    }
    return validateLeaveLeadTime({
      dayType: dayType === '' ? 'full' : dayType,
      weekdayDuration: dayType === 'full' ? leaveDuration : 0,
      startDateISO: startDate,
      filedOnISO: todayISO(),
    })
  }, [dayType, leaveDuration, leaveType, startDate])

  const workingDaysOnly =
    leaveType !== '' && !usesCalendarDayCounting(leaveType)

  const groupMissing = groupId === ''
  const employeeMissing = employeeId === ''
  const leaveTypeMissing = leaveType === ''
  const dayTypeMissing = dayType === ''
  const startMissing = startDate === ''
  const endMissing = endDate === ''
  const reasonMissing = reason.trim().length === 0
  const attachmentMissing = needsAttachment && attachments.length === 0

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
    !attachmentUploading &&
    leadTimeValidation.ok &&
    !exceedsCredits &&
    !noCredits

  function clearApiErrors() {
    setApiErrors(clearLeaveFormApiErrors())
  }

  function resetLeaveFields() {
    setLeaveType(EMPTY_LEAVE.leaveType)
    setDayType(EMPTY_LEAVE.dayType)
    setStartDate(EMPTY_LEAVE.startDate)
    setEndDate(EMPTY_LEAVE.endDate)
    setReason(EMPTY_LEAVE.reason)
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
    setAttachments([])
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
    if (selectedEmpId == null || dayType === '' || !isFilableLeaveCode(leaveType)) {
      return
    }
    if (needsAttachment && attachments.length === 0) return

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
        leave_reason: reason.trim(),
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
                disabled={!endDateEnabled || dayType !== 'full' || fixedRange}
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
              {noCredits ? (
                <div
                  className="flex gap-2 rounded-md border-2 border-status-rejected bg-status-rejected/10 px-3 py-2.5 sm:col-span-2"
                  role="alert"
                >
                  <TriangleAlert
                    className="mt-0.5 size-4 shrink-0 text-status-rejected"
                    aria-hidden="true"
                  />
                  <p className="text-small font-semibold text-status-rejected">
                    This member has no remaining {selectedTypeLabel} credits.
                    This leave type cannot be filed without available credits.
                  </p>
                </div>
              ) : exceedsCredits ? (
                <div
                  className="flex gap-2 rounded-md border-2 border-status-rejected bg-status-rejected/10 px-3 py-2.5 sm:col-span-2"
                  role="alert"
                >
                  <TriangleAlert
                    className="mt-0.5 size-4 shrink-0 text-status-rejected"
                    aria-hidden="true"
                  />
                  <p className="text-small font-semibold text-status-rejected">
                    Duration exceeds remaining {selectedTypeLabel} credits.
                    Shorten the leave, or file remaining days as Vacation Leave.
                  </p>
                </div>
              ) : mayBeLwop ? (
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
            disabled={!leadTimeValidation.ok || attachmentUploading}
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
