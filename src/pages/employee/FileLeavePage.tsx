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
import { FileField } from '../../components/ui/form/FileField'
import { SelectField } from '../../components/ui/form/SelectField'
import { TextAreaField } from '../../components/ui/form/TextAreaField'
import { TextField } from '../../components/ui/form/TextField'
import { QuarterlyVlLimitBanner } from '../../components/ui/QuarterlyVlLimitBanner'
import { useToast } from '../../components/ui/ToastProvider'
import { useNonWorkingHolidayDates } from '../../hooks/api/useHolidays'
import { useMyBalances } from '../../hooks/api/useMyBalances'
import { swrKeys, isAdminLeavesListKey, isLeaveListKey } from '../../hooks/api/swrKeys'
import {
  clampLongLeaveEndDate,
  countLeaveDurationDays,
  fixedLeaveEndDate,
  formatDurationLabel,
  isLongLeaveEndInBounds,
  leaveEndPickerLimits,
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
  isFilableLeaveCode,
  isFixedRangeLeave,
  isLongLeave,
  isPaternityLeave,
  isSpecialLeave,
  MED_CERT_ACCEPT,
  PATERNITY_NOTIFICATION_FORM_FILENAME,
  paternityNotificationFormHref,
  requiresAttachment,
  requiresFullDay,
  SPL_ASSIGNMENT_TYPE_OPTIONS,
  SPL_QUALIFYING_EVENT_OPTIONS,
  type SplAssignmentType,
  type SplQualifyingEvent,
} from '../../utils/leaveFiling'
import {
  clearLeaveFormApiErrors,
  parseLeaveFormApiError,
  type LeaveFormApiErrors,
} from '../../utils/leaveFormApiErrors'
import {
  LEAVE_LEAD_TIME_UNGATED,
  validateLeaveLeadTime,
} from '../../utils/leaveLeadTime'

const DAY_TYPE_OPTIONS = [
  { value: 'full', label: 'Whole day' },
  { value: 'half_am', label: 'Half day (AM)' },
  { value: 'half_pm', label: 'Half day (PM)' },
] as const

const EMPTY_FORM = {
  leaveType: '',
  dayType: '' as '' | DayType,
  startDate: '',
  endDate: '',
  reason: '',
  assignmentType: '' as '' | SplAssignmentType,
  qualifyingEvent: '' as '' | SplQualifyingEvent,
}

export function FileLeavePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { mutate } = useSWRConfig()
  const toast = useToast()
  const { nonWorkingDates, holidayNames } = useNonWorkingHolidayDates()
  const { data: balances } = useMyBalances()

  const [leaveType, setLeaveType] = useState(EMPTY_FORM.leaveType)
  const [dayType, setDayType] = useState<'' | DayType>(EMPTY_FORM.dayType)
  const [startDate, setStartDate] = useState(EMPTY_FORM.startDate)
  const [endDate, setEndDate] = useState(EMPTY_FORM.endDate)
  const [reason, setReason] = useState(EMPTY_FORM.reason)
  const [assignmentType, setAssignmentType] = useState<
    '' | SplAssignmentType
  >(EMPTY_FORM.assignmentType)
  const [qualifyingEvent, setQualifyingEvent] = useState<
    '' | SplQualifyingEvent
  >(EMPTY_FORM.qualifyingEvent)
  const [attachments, setAttachments] = useState<File[]>([])
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apiErrors, setApiErrors] = useState<LeaveFormApiErrors>(
    clearLeaveFormApiErrors,
  )

  const dayTypeEnabled = leaveType !== ''
  const startDateEnabled = leaveType !== '' && dayType !== ''
  const endDateEnabled = startDate !== ''
  const needsAttachment = requiresAttachment(leaveType)
  const needsSplDetails = isSpecialLeave(leaveType)
  const fullDayOnly = requiresFullDay(leaveType)
  const fixedRange = isFixedRangeLeave(leaveType)
  const attachmentLabel = attachmentFieldLabel(leaveType)
  const selectedTypeLabel = filableLeaveLabel(leaveType)
  const leaveTypeOptions = filableLeaveTypeOptionsForGender(user.gender)
  const endPickerLimits = leaveEndPickerLimits(leaveType, startDate)
  const dayTypeOptions = fullDayOnly
    ? DAY_TYPE_OPTIONS.filter((option) => option.value === 'full')
    : DAY_TYPE_OPTIONS

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

  const leadTimeValidation = useMemo(() => {
    if (!appliesVlLeadTime(leaveType)) {
      return LEAVE_LEAD_TIME_UNGATED
    }
    return validateLeaveLeadTime({
      dayType: dayType === '' ? 'full' : dayType,
      weekdayDuration: dayType === 'full' ? leaveDuration : 0,
      startDateISO: startDate,
      filedOnISO: todayISO(),
      nonWorkingDates,
    })
  }, [dayType, leaveDuration, leaveType, nonWorkingDates, startDate])

  const workingDaysOnly =
    leaveType !== '' && !usesCalendarDayCounting(leaveType)

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
  // Quarterly VL usage (days used this quarter). Wire when the API exposes it;
  // banner stays hidden while null and never blocks filing.
  const quarterlyVlUsedDays: number | null = null
  const exceedsCredits =
    leaveType !== '' &&
    enforcesRemainingCredits(leaveType) &&
    leaveDuration > 0 &&
    Number.isFinite(remainingDays) &&
    leaveDuration > remainingDays
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

  const leaveTypeMissing = leaveType === ''
  const dayTypeMissing = dayType === ''
  const startMissing = startDate === ''
  const endMissing = endDate === ''
  const reasonMissing = reason.trim().length === 0
  const attachmentMissing = needsAttachment && attachments.length === 0
  const assignmentTypeMissing = needsSplDetails && assignmentType === ''
  const qualifyingEventMissing = needsSplDetails && qualifyingEvent === ''

  const longLeaveRangeInvalid =
    isLongLeave(leaveType) &&
    startDate !== '' &&
    endDate !== '' &&
    !isLongLeaveEndInBounds(startDate, endDate)

  const formValid =
    !leaveTypeMissing &&
    isFilableLeaveCode(leaveType) &&
    !dayTypeMissing &&
    !startMissing &&
    !endMissing &&
    !reasonMissing &&
    !attachmentMissing &&
    !assignmentTypeMissing &&
    !qualifyingEventMissing &&
    !attachmentUploading &&
    leadTimeValidation.ok &&
    !exceedsCredits &&
    !noCredits &&
    !longLeaveRangeInvalid

  function handleLeaveTypeChange(value: string) {
    setLeaveType(value)
    setDayType(requiresFullDay(value) ? 'full' : EMPTY_FORM.dayType)
    setStartDate(EMPTY_FORM.startDate)
    setEndDate(EMPTY_FORM.endDate)
    setAssignmentType(EMPTY_FORM.assignmentType)
    setQualifyingEvent(EMPTY_FORM.qualifyingEvent)
    setAttachments([])
    clearApiErrors()
  }

  function handleAssignmentTypeChange(value: string) {
    setAssignmentType(value as '' | SplAssignmentType)
    if (apiErrors.assignmentType || apiErrors.form) clearApiErrors()
  }

  function handleQualifyingEventChange(value: string) {
    setQualifyingEvent(value as '' | SplQualifyingEvent)
    if (apiErrors.qualifyingEvent || apiErrors.form) clearApiErrors()
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
    setAssignmentType(EMPTY_FORM.assignmentType)
    setQualifyingEvent(EMPTY_FORM.qualifyingEvent)
    setAttachments([])
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
    if (dayType === '' || !isFilableLeaveCode(leaveType)) return
    if (needsAttachment && attachments.length === 0) return
    if (needsSplDetails && (assignmentType === '' || qualifyingEvent === '')) {
      return
    }

    setConfirmOpen(false)
    setSubmitting(true)
    clearApiErrors()

    try {
      await createLeave({
        code: leaveType,
        start_date: startDate,
        end_date: endDate,
        day_type: dayType as ApiDayType,
        leave_reason: reason.trim(),
        ...(needsSplDetails
          ? {
              assignment_type: assignmentType,
              qualifying_event: qualifyingEvent,
            }
          : {}),
        ...(needsAttachment && attachments.length > 0
          ? { leave_attachment: attachments }
          : {}),
      })

      await Promise.all([
        mutate(isLeaveListKey, undefined, { revalidate: true }),
        mutate(swrKeys.balances()),
        mutate(swrKeys.pendingApprovals),
        mutate(isAdminLeavesListKey, undefined, { revalidate: true }),
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
    if (isFixedRangeLeave(leaveType)) {
      setEndDate(fixedLeaveEndDate(leaveType, value, nonWorkingDates))
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

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
      >
        <h1 className="shrink-0 text-h1 text-text-black">Apply Leave</h1>

        <section className="shrink-0 rounded-lg border border-border bg-surface px-4 py-3 sm:px-5">
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

        <section className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
          <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-h2 text-text-black">Leave Information</h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-4">
            <div className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2">
              <SelectField
                label="Leave Type"
                value={leaveType}
                onChange={handleLeaveTypeChange}
                placeholder="Select Leave Type"
                options={leaveTypeOptions}
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
                options={[...dayTypeOptions]}
                disabled={!dayTypeEnabled || fullDayOnly}
                error={
                  triedSubmit && dayTypeEnabled && dayTypeMissing
                    ? 'Please select a day type.'
                    : (apiErrors.dayType ?? null)
                }
              />
              {needsSplDetails ? (
                <>
                  <SelectField
                    label="Assignment Type"
                    value={assignmentType}
                    onChange={handleAssignmentTypeChange}
                    placeholder="Select Assignment Type"
                    options={[...SPL_ASSIGNMENT_TYPE_OPTIONS]}
                    error={
                      triedSubmit && assignmentTypeMissing
                        ? 'Please select an assignment type.'
                        : (apiErrors.assignmentType ?? null)
                    }
                  />
                  <SelectField
                    label="Qualifying Event / Relationship"
                    value={qualifyingEvent}
                    onChange={handleQualifyingEventChange}
                    placeholder="Select Qualifying Event / Relationship"
                    options={[...SPL_QUALIFYING_EVENT_OPTIONS]}
                    error={
                      triedSubmit && qualifyingEventMissing
                        ? 'Please select a qualifying event / relationship.'
                        : (apiErrors.qualifyingEvent ?? null)
                    }
                  />
                </>
              ) : null}
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
              <TextField
                label="Duration"
                value={durationLabel}
                readOnly
                className="sm:col-span-2"
              />
              {leaveType === 'VL' ? (
                <QuarterlyVlLimitBanner
                  usedDays={quarterlyVlUsedDays}
                  additionalDays={leaveDuration}
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
              ) : null}
              {leadTimeValidation.gated ? (
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
                    <p className="text-body font-semibold text-text-black">
                      {leadTimeValidation.title}
                    </p>
                    <p className="mt-1 text-small text-text-black">
                      {leadTimeValidation.message}
                      {leadTimeValidation.ok ? (
                        <>
                          {' '}
                          Your{' '}
                          <span className="font-semibold">
                            selected dates meet this requirement.
                          </span>
                        </>
                      ) : (
                        ' Choose a later start date or shorten the leave duration.'
                      )}
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
                    triedSubmit && attachmentMissing
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
