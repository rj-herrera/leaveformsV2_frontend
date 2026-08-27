import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { ApiError } from '../../api/axios-client'
import { updateLeave } from '../../api/leaves'
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
import { isLeaveListKey, swrKeys } from '../../hooks/api/swrKeys'
import {
  countLeaveDurationDays,
  formatDurationLabel,
  todayISO,
  usesCalendarDayCounting,
  type DayType,
} from '../../utils/leaveDates'
import {
  appliesVlLeadTime,
  attachmentFieldLabel,
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

/** Edit allowed only for pending VL/SL/PTB/EL with no approval history (API rule). */
function isLeaveEditable(detail: LeaveDetail): boolean {
  return isPendingLeaveEditable(detail)
}

type EditLeaveFormProps = {
  detail: LeaveDetail
}

function EditLeaveForm({ detail }: EditLeaveFormProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { mutate } = useSWRConfig()
  const toast = useToast()
  const { nonWorkingDates, holidayNames } = useNonWorkingHolidayDates()

  const detailsPath = `/my-leave/requests/${detail.id}`
  const leaveTypeLabel = detail.leave_type.name
  const leaveTypeCode = detail.leave_type.code
  const needsAttachment = requiresAttachment(leaveTypeCode)
  const fullDayOnly = requiresFullDay(leaveTypeCode)
  const hasExistingAttachment = detail.has_attachment
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
    if (!appliesVlLeadTime(leaveTypeCode)) {
      return { ok: true, isLongLeave: false, message: null }
    }
    return validateLeaveLeadTime({
      dayType,
      weekdayDuration: dayType === 'full' ? leaveDuration : 0,
      startDateISO: startDate,
      filedOnISO: todayISO(),
    })
  }, [dayType, leaveDuration, leaveTypeCode, startDate])

  const workingDaysOnly = !usesCalendarDayCounting(leaveTypeCode)

  const reasonMissing = reason.trim().length === 0
  const replacementCert = attachments[0] ?? null
  const attachmentMissing =
    needsAttachment && !hasExistingAttachment && replacementCert == null
  const isDirty =
    dayType !== detail.day_type ||
    startDate !== detail.start_date ||
    endDate !== detail.end_date ||
    reason.trim() !== detail.leave_reason.trim() ||
    replacementCert != null
  const formValid =
    startDate !== '' &&
    endDate !== '' &&
    !reasonMissing &&
    !attachmentMissing &&
    !attachmentUploading &&
    leadTimeValidation.ok &&
    isDirty

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
    if (dayType !== 'full' || !endDate || value > endDate) {
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
    navigate(detailsPath)
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
      const updated = await updateLeave(detail.id, {
        start_date: startDate,
        end_date: endDate,
        day_type: dayType as ApiDayType,
        leave_reason: reason.trim(),
        ...(needsAttachment && replacementCert
          ? { leave_attachment: replacementCert }
          : {}),
      })

      await Promise.all([
        mutate(swrKeys.leave(detail.id), updated, { revalidate: false }),
        mutate(isLeaveListKey, undefined, { revalidate: true }),
        mutate(swrKeys.balances()),
      ])

      toast.success('Leave request updated successfully.')
      navigate(detailsPath)
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
                min={startDate || undefined}
                disabled={dayType !== 'full'}
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
                  multiple={false}
                  className="sm:col-span-2"
                  hint={
                    hasExistingAttachment
                      ? `A ${attachmentLabel.toLowerCase()} is already on file. Upload a replacement only if you need to change it.`
                      : 'PDF, JPG, or PNG.'
                  }
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
          <Button type="button" onClick={handleCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!formValid || submitting}
            title={
              submitting
                ? 'Saving…'
                : attachmentUploading
                  ? 'Wait for the attachment upload to finish.'
                  : !isDirty
                    ? 'No changes to save'
                    : undefined
            }
          >
            {submitting ? 'Saving…' : 'Confirm'}
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
  const leaveId = Number(leaveRequestId)
  const validId = Number.isInteger(leaveId) && leaveId > 0

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

  if (notFound || !detail) {
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
            Open a request from your dashboard list to edit it.
          </p>
        </div>
      </div>
    )
  }

  if (!isLeaveEditable(detail)) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <Link
          to={`/my-leave/requests/${detail.id}`}
          className="text-body inline-flex w-fit items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Leave Request
        </Link>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h1 className="text-h1 text-text-black">Editing unavailable</h1>
          <p className="mt-2 text-body text-text-gray">
            This leave can only be edited while it is pending approval and
            before any approver has acted.
          </p>
        </div>
      </div>
    )
  }

  return <EditLeaveForm detail={detail} />
}
