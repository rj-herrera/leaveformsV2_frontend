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
import { LeaveCreditsFilingBanner } from '../../components/leave/LeaveCreditsFilingBanner'
import { QuarterlyVlLimitBanner } from '../../components/ui/QuarterlyVlLimitBanner'
import { useToast } from '../../components/ui/ToastProvider'
import { useNonWorkingHolidayDates } from '../../hooks/api/useHolidays'
import { useLeaveQuarterUsage } from '../../hooks/api/useLeaveQuarterUsage'
import { useMyBalances } from '../../hooks/api/useMyBalances'
import { swrKeys, isAdminLeavesListKey, isLeaveListKey } from '../../hooks/api/swrKeys'
import {
  clampLongLeaveEndDate,
  countLeaveDurationDays,
  fixedLeaveEndDate,
  formatDurationLabel,
  isLongLeaveEndInBounds,
  isWorkingDayISO,
  leaveEndPickerLimits,
  todayISO,
  usesCalendarDayCounting,
  type DayType,
} from '../../utils/leaveDates'
import {
  appliesVlLeadTime,
  ATTACHMENT_MAX_FILES,
  attachmentFieldHint,
  attachmentFieldLabel,
  filableLeaveLabel,
  filableLeaveTypeOptionsForGender,
  getLeaveCreditsFilingNotice,
  hasDerivedEndDate,
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
import {
  LEAVE_LEAD_TIME_UNGATED,
  validateLeaveLeadTime,
} from '../../utils/leaveLeadTime'
import { isQuarterUsageExceeded } from '../../utils/quarterlyVlLimit'

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
  specialLeaveReason: '' as '' | SplSpecialLeaveReason,
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
  const [specialLeaveReason, setSpecialLeaveReason] = useState<
    '' | SplSpecialLeaveReason
  >(EMPTY_FORM.specialLeaveReason)
  const [attachments, setAttachments] = useState<File[]>([])
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apiErrors, setApiErrors] = useState<LeaveFormApiErrors>(
    clearLeaveFormApiErrors,
  )

  const dayTypeEnabled = leaveType !== ''
  const needsSplDetails = isSpecialLeave(leaveType)
  const startDateEnabled =
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
  const leaveTypeOptions = filableLeaveTypeOptionsForGender(user.gender)
  const endPickerLimits = leaveEndPickerLimits(leaveType, startDate)
  const dayTypeOptions = fullDayOnly
    ? DAY_TYPE_OPTIONS.filter((option) => option.value === 'full')
    : DAY_TYPE_OPTIONS
  const splReasonOptions = splReasonOptionsFor(assignmentType)
  const splCalendarDays = usesSplCalendarDays(
    assignmentType,
    specialLeaveReason,
  )

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

  const { data: quarterUsage } = useLeaveQuarterUsage({
    code: leaveType,
    startDate,
    endDate,
    dayType,
  })
  const quarterUsageExceeded = isQuarterUsageExceeded(quarterUsage)

  const workingDaysOnly = needsSplDetails
    ? !splCalendarDays
    : leaveType !== '' && !usesCalendarDayCounting(leaveType)

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
  const creditsNotice = getLeaveCreditsFilingNotice({
    leaveType,
    remainingDays,
    durationDays: leaveDuration,
  })
  const exceedsCredits = creditsNotice === 'exceedsCredits'
  const noCredits = creditsNotice === 'noCredits'
  const remainingLabel = useMemo(() => {
    if (!Number.isFinite(remainingDays)) return '0 days'
    return formatDurationLabel(remainingDays, 'full')
  }, [remainingDays])

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
    setSpecialLeaveReason(EMPTY_FORM.specialLeaveReason)
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
      start = EMPTY_FORM.startDate
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
        : EMPTY_FORM.endDate,
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
    setSpecialLeaveReason(EMPTY_FORM.specialLeaveReason)
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
        mutate(isLeaveListKey, undefined, { revalidate: true }),
        mutate(swrKeys.balances()),
        mutate(swrKeys.pendingApprovals),
        mutate(isAdminLeavesListKey, undefined, { revalidate: true }),
      ])

      toast.success('Leave request submitted.')
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
          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-4">
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
                    value={specialLeaveReason}
                    onChange={handleSpecialLeaveReasonChange}
                    placeholder="Select Qualifying Event / Relationship"
                    options={[...splReasonOptions]}
                    disabled={assignmentType === ''}
                    error={
                      triedSubmit && specialLeaveReasonMissing
                        ? 'Please select a qualifying event / relationship.'
                        : (apiErrors.specialLeaveReason ?? null)
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
              <TextField
                label="Duration"
                value={durationLabel}
                readOnly
                className="sm:col-span-2"
              />
              {leaveType === 'VL' ? (
                <QuarterlyVlLimitBanner
                  usage={quarterUsage}
                  className="sm:col-span-2"
                />
              ) : null}
              {creditsNotice ? (
                <LeaveCreditsFilingBanner
                  notice={creditsNotice}
                  leaveTypeLabel={selectedTypeLabel}
                  audience="self"
                  durationLabel={durationLabel}
                  remainingLabel={remainingLabel}
                  className="sm:col-span-2"
                />
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
                  error={
                    triedSubmit && reasonMissing
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
        title={
          quarterUsageExceeded
            ? 'Submit leave and notify admin?'
            : 'Confirm leave request'
        }
        description={
          quarterUsageExceeded ? (
            <>
              This Vacation Leave would exceed the{' '}
              <span className="font-semibold">9-day</span> quarterly cap and may
              result in a memo. Admin will be notified. Submit anyway?
            </>
          ) : (
            'Are you sure you want to submit this leave request?'
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
