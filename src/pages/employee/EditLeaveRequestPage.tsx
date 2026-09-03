import { useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { ArrowLeft, TriangleAlert, X } from 'lucide-react'
import { ApiError } from '../../api/axios-client'
import { syncLeaveAttachments, updateLeave } from '../../api/leaves'
import type { DayType as ApiDayType, LeaveDetail } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { DateFieldCustom } from '../../components/ui/form/DateFieldCustom'
import { FileField } from '../../components/ui/form/FileField'
import { SelectField } from '../../components/ui/form/SelectField'
import { TextAreaField } from '../../components/ui/form/TextAreaField'
import { TextField } from '../../components/ui/form/TextField'
import { useToast } from '../../components/ui/ToastProvider'
import { FormPageLoadingView } from '../../components/ui/Skeleton'
import { useLeaveDetail } from '../../hooks/api/useLeaveDetail'
import { useNonWorkingHolidayDates } from '../../hooks/api/useHolidays'
import { isApprovalsListKey, isLeaveListKey, swrKeys } from '../../hooks/api/swrKeys'
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
  appliesVlLeadTime,
  ATTACHMENT_MAX_FILES,
  attachmentFieldHint,
  attachmentFieldLabel,
  isFixedRangeLeave,
  isLeaveSelfFiled,
  isLongLeave,
  isPendingLeaveEditable,
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

function leaveRequestPathFromEditLocation(
  pathname: string,
  leaveId: number,
): string {
  if (pathname.startsWith('/team/leave-approvals/')) {
    return `/team/leave-approvals/${leaveId}`
  }
  if (pathname.startsWith('/team/leave-requests/')) {
    return `/team/leave-requests/${leaveId}`
  }
  return `/my-leave/requests/${leaveId}`
}

function editPageListFallback(pathname: string): string {
  return pathname.startsWith('/team/') ? '/team/leave-approvals' : '/dashboard'
}

function editPageListFallbackLabel(pathname: string): string {
  return pathname.startsWith('/team/')
    ? 'Back to Leave Approvals'
    : 'Back to Dashboard'
}

/** Edit allowed only for pending leave the viewer filed or is on, with no approval history. */
function isLeaveEditable(detail: LeaveDetail, userId: string): boolean {
  return isPendingLeaveEditable(detail, userId)
}

type EditLeaveFormProps = {
  detail: LeaveDetail
  detailsPath: string
}

function EditLeaveForm({ detail, detailsPath }: EditLeaveFormProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { mutate } = useSWRConfig()
  const toast = useToast()
  const { nonWorkingDates, holidayNames } = useNonWorkingHolidayDates()

  const leaveTypeLabel = detail.leave_type.name
  const leaveTypeCode = detail.leave_type.code
  const selfFiled = isLeaveSelfFiled(detail)
  const employeeNumber =
    detail.employee?.employee_number ?? String(detail.emp_id)
  const employeeName = detail.employee?.name?.trim() || '—'
  const needsAttachment = requiresAttachment(leaveTypeCode)
  const fullDayOnly = requiresFullDay(leaveTypeCode)
  const fixedRange = isFixedRangeLeave(leaveTypeCode)
  const longLeave = isLongLeave(leaveTypeCode)
  const storedAttachments = detail.attachments ?? []
  const attachmentLabel = attachmentFieldLabel(leaveTypeCode)
  const dayTypeOptions = fullDayOnly
    ? DAY_TYPE_OPTIONS.filter((option) => option.value === 'full')
    : DAY_TYPE_OPTIONS

  const [dayType, setDayType] = useState<DayType>(
    fullDayOnly ? 'full' : detail.day_type,
  )
  const [startDate, setStartDate] = useState(detail.start_date)
  const [endDate, setEndDate] = useState(detail.end_date)
  const [reason, setReason] = useState(detail.leave_reason)
  const [attachments, setAttachments] = useState<File[]>([])
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<number[]>([])
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apiErrors, setApiErrors] = useState<LeaveFormApiErrors>(
    clearLeaveFormApiErrors,
  )

  function clearApiErrors() {
    setApiErrors(clearLeaveFormApiErrors())
  }

  const leaveDuration = useMemo(() => {
    if (!startDate || !endDate) return 0
    if (dayType === 'half_am' || dayType === 'half_pm') return 0.5
    return countLeaveDurationDays(
      leaveTypeCode,
      startDate,
      endDate,
      nonWorkingDates,
    )
  }, [dayType, startDate, endDate, leaveTypeCode, nonWorkingDates])

  const durationLabel = useMemo(() => {
    if (dayType === 'half_am' || dayType === 'half_pm') {
      return formatDurationLabel(0.5, dayType)
    }
    return formatDurationLabel(leaveDuration, 'full')
  }, [dayType, leaveDuration])

  const leadTimeValidation = useMemo(() => {
    if (!selfFiled || !appliesVlLeadTime(leaveTypeCode)) {
      return { ok: true, isLongLeave: false, message: null }
    }
    return validateLeaveLeadTime({
      dayType,
      weekdayDuration: dayType === 'full' ? leaveDuration : 0,
      startDateISO: startDate,
      filedOnISO: todayISO(),
    })
  }, [dayType, leaveDuration, leaveTypeCode, selfFiled, startDate])

  const workingDaysOnly = !usesCalendarDayCounting(leaveTypeCode)
  const endPickerLimits = leaveEndPickerLimits(leaveTypeCode, startDate)

  const reasonMissing = reason.trim().length === 0
  const keptExisting = storedAttachments.filter(
    (file) => !removedAttachmentIds.includes(file.id),
  )
  const remainingSlots = Math.max(
    0,
    ATTACHMENT_MAX_FILES - keptExisting.length,
  )
  const totalAttachmentCount = keptExisting.length + attachments.length
  const attachmentMissing = needsAttachment && totalAttachmentCount === 0
  const attachmentsDirty =
    removedAttachmentIds.length > 0 || attachments.length > 0
  const fieldsDirty =
    dayType !== detail.day_type ||
    startDate !== detail.start_date ||
    endDate !== detail.end_date ||
    reason.trim() !== detail.leave_reason.trim()
  const isDirty = fieldsDirty || attachmentsDirty
  const formValid =
    startDate !== '' &&
    endDate !== '' &&
    !reasonMissing &&
    !attachmentMissing &&
    !attachmentUploading &&
    leadTimeValidation.ok &&
    isDirty &&
    !(longLeave && !isLongLeaveEndInBounds(startDate, endDate))

  function handleDayTypeChange(value: string) {
    const next = value as DayType
    setDayType(next)
    if (next === 'half_am' || next === 'half_pm') {
      setEndDate(startDate)
    }
    clearApiErrors()
  }

  function handleStartDateChange(value: string) {
    setStartDate(value)
    if (isFixedRangeLeave(leaveTypeCode)) {
      setEndDate(fixedLeaveEndDate(leaveTypeCode, value, nonWorkingDates))
    } else if (longLeave) {
      setEndDate(clampLongLeaveEndDate(value, endDate))
    } else if (dayType !== 'full' || !endDate || value > endDate) {
      setEndDate(value)
    }
    clearApiErrors()
  }

  function handleEndDateChange(value: string) {
    setEndDate(value)
    if (startDate && value < startDate) {
      setStartDate(value)
    }
    clearApiErrors()
  }

  function handleReasonChange(value: string) {
    setReason(value)
    if (apiErrors.reason || apiErrors.form) clearApiErrors()
  }

  function handleCancel() {
    navigate(detailsPath, { state: location.state })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTriedSubmit(true)
    clearApiErrors()
    if (!formValid) return
    setConfirmOpen(true)
  }

  async function handleConfirmEdit() {
    setConfirmOpen(false)
    setSubmitting(true)
    clearApiErrors()

    try {
      let latest: LeaveDetail = detail
      if (fieldsDirty) {
        latest = await updateLeave(detail.id, {
          start_date: startDate,
          end_date: endDate,
          day_type: dayType as ApiDayType,
          leave_reason: reason.trim(),
        })
      }

      if (attachmentsDirty) {
        const synced = await syncLeaveAttachments(
          detail.id,
          storedAttachments,
          keptExisting.map((file) => file.id),
          attachments,
        )
        if (synced) latest = synced
      }

      await Promise.all([
        mutate(swrKeys.leave(detail.id), latest, { revalidate: false }),
        mutate(isLeaveListKey, undefined, { revalidate: true }),
        mutate(swrKeys.balances()),
        ...(detailsPath.startsWith('/team/')
          ? [
              mutate(swrKeys.pendingApprovals),
              mutate(isApprovalsListKey, undefined, { revalidate: true }),
              mutate(swrKeys.memberBalances(detail.emp_id)),
            ]
          : []),
      ])

      toast.success('Leave request updated successfully.')
      navigate(detailsPath, { state: location.state })
    } catch (error) {
      setApiErrors(
        parseLeaveFormApiError(
          error,
          'Unable to save leave request. Please try again.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <Link
        to={detailsPath}
        state={location.state}
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
              value={employeeNumber}
              readOnly
            />
            <TextField label="Name" value={employeeName} readOnly />
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
          <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-h2 text-text-black">Leave Information</h2>
            <p className="mt-1 text-small text-text-gray">
              Leave type cannot be changed after filing.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-3 sm:px-4">
            <div className="grid min-w-0 grid-cols-1 content-start gap-3 sm:grid-cols-2 sm:gap-4">
              <TextField label="Leave Type" value={leaveTypeLabel} readOnly />
              <SelectField
                label="Day Type"
                value={dayType}
                onChange={handleDayTypeChange}
                placeholder="Select Day Type"
                options={[...dayTypeOptions]}
                disabled={fullDayOnly}
                error={apiErrors.dayType}
              />
              <DateFieldCustom
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                weekdaysOnly={workingDaysOnly}
                nonWorkingDates={nonWorkingDates}
                holidayNames={holidayNames}
                invalid={Boolean(apiErrors.dates)}
              />
              <DateFieldCustom
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                weekdaysOnly={workingDaysOnly}
                nonWorkingDates={nonWorkingDates}
                holidayNames={holidayNames}
                min={endPickerLimits.min}
                max={endPickerLimits.max}
                disabled={dayType !== 'full' || fixedRange}
                invalid={Boolean(apiErrors.dates) && dayType === 'full'}
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
                rows={3}
                error={
                  triedSubmit && reasonMissing
                    ? 'Reason is required.'
                    : (apiErrors.reason ?? null)
                }
              />
              {needsAttachment ? (
                <div className="sm:col-span-2">
                  {keptExisting.length > 0 ? (
                    <div className="mb-3">
                      <p className="text-small text-text-gray">On file</p>
                      <ul
                        className="mt-2 flex flex-wrap gap-2"
                        aria-label="Existing attachments"
                      >
                        {keptExisting.map((file) => (
                          <li key={file.id}>
                            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-surface-muted py-1 pr-1 pl-3 text-small text-text-black">
                              <span className="truncate" title={file.name}>
                                {file.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (totalAttachmentCount <= 1) return
                                  setRemovedAttachmentIds((ids) => [
                                    ...ids,
                                    file.id,
                                  ])
                                  if (apiErrors.attachment || apiErrors.form) {
                                    clearApiErrors()
                                  }
                                }}
                                disabled={totalAttachmentCount <= 1}
                                className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-text-gray transition-colors hover:bg-surface hover:text-text-black focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`Remove ${file.name}`}
                                title={
                                  totalAttachmentCount <= 1
                                    ? 'At least one file must remain'
                                    : 'Remove file'
                                }
                              >
                                <X className="size-3.5" aria-hidden="true" />
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {remainingSlots > 0 || attachments.length > 0 ? (
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
                      required={keptExisting.length === 0}
                      maxFiles={Math.max(remainingSlots, attachments.length)}
                      hint={
                        keptExisting.length > 0
                          ? `Existing files stay on file unless you remove them. ${attachmentFieldHint()}`
                          : attachmentFieldHint()
                      }
                      error={
                        triedSubmit && attachmentMissing
                          ? `${attachmentLabel} is required for this leave type.`
                          : (apiErrors.attachment ?? null)
                      }
                    />
                  ) : (
                    <p className="mt-1 text-small text-text-gray">
                      Existing files stay on file unless you remove them.{' '}
                      {attachmentFieldHint()}
                    </p>
                  )}
                </div>
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
          <Button type="button" onClick={handleCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!formValid || attachmentUploading}
            loading={submitting}
            loadingText="Saving…"
            title={
              attachmentUploading
                ? 'Wait for the attachment upload to finish.'
                : !isDirty
                  ? 'No changes to save'
                  : undefined
            }
          >
            Confirm
          </Button>
        </div>
      </form>

      <ConfirmReasonModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          void handleConfirmEdit()
        }}
        title="Confirm leave request edit"
        description="Are you sure you want to save these changes to the leave request?"
        requireReason={false}
        confirmLabel="Save changes"
        cancelLabel="Cancel"
        confirmVariant="primary"
      />
    </div>
  )
}

export function EditLeaveRequestPage() {
  const { leaveRequestId } = useParams<{ leaveRequestId: string }>()
  const location = useLocation()
  const { user } = useAuth()
  const leaveId = Number(leaveRequestId)
  const validId = Number.isInteger(leaveId) && leaveId > 0
  const detailsPath = validId
    ? leaveRequestPathFromEditLocation(location.pathname, leaveId)
    : editPageListFallback(location.pathname)
  const listFallback = editPageListFallback(location.pathname)
  const listFallbackLabel = editPageListFallbackLabel(location.pathname)

  const { data: detail, error, isLoading } = useLeaveDetail(
    validId ? leaveId : null,
  )

  const notFound =
    !validId ||
    (error instanceof ApiError && error.status === 404) ||
    (!isLoading && !detail && error != null)

  if (isLoading) {
    return (
      <FormPageLoadingView
        backTo={detailsPath}
        backLabel="Back to Leave Request"
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

  if (notFound || !detail) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <Link
          to={listFallback}
          className="text-body inline-flex w-fit items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {listFallbackLabel}
        </Link>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h1 className="text-h1 text-text-black">Leave request not found</h1>
          <p className="mt-2 text-body text-text-gray">
            Open a request from the list to edit it.
          </p>
        </div>
      </div>
    )
  }

  if (!isLeaveEditable(detail, user.id)) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <Link
          to={detailsPath}
          state={location.state}
          className="text-body inline-flex w-fit items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Leave Request
        </Link>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h1 className="text-h1 text-text-black">Editing unavailable</h1>
          <p className="mt-2 text-body text-text-gray">
            This leave can only be edited by the person on leave or the person
            who filed it, while it is pending approval and before any approver
            has acted.
          </p>
        </div>
      </div>
    )
  }

  return <EditLeaveForm detail={detail} detailsPath={detailsPath} />
}
