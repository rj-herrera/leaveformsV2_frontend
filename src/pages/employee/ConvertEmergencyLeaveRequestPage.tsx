import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { ApiError } from '../../api/axios-client'
import type { LeaveDetail } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { DropzoneFileField } from '../../components/ui/form/DropzoneFileField'
import { TextAreaField } from '../../components/ui/form/TextAreaField'
import { FormPageLoadingView } from '../../components/ui/Skeleton'
import { useLeaveDetail } from '../../hooks/api/useLeaveDetail'
import { canRequestConversion } from '../../utils/leaveConversion'

/** Same accept list as sick-leave conversion attachments. */
const ATTACHMENT_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

type ConvertEmergencyLeaveFormProps = {
  detail: LeaveDetail
}

function ConvertEmergencyLeaveForm({ detail }: ConvertEmergencyLeaveFormProps) {
  const navigate = useNavigate()
  const detailsPath = `/my-leave/requests/${detail.id}`

  const [conversionReason, setConversionReason] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitNotice, setSubmitNotice] = useState<string | null>(null)

  const reasonMissing = conversionReason.trim().length === 0
  const canSubmit = !reasonMissing && !attachmentUploading

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTriedSubmit(true)
    setSubmitNotice(null)
    if (!canSubmit) return
    setConfirmOpen(true)
  }

  function handleConfirmConversion() {
    setConfirmOpen(false)
    // API wiring deferred — layout and client-side validation only for now.
    setSubmitNotice(
      'Emergency Leave conversion is not available yet. Submission will be enabled once the backend is ready.',
    )
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
        <h1 className="shrink-0 text-h1 text-text-black">
          Convert to Emergency Leave
        </h1>

        <section className="flex min-h-0 flex-[0_1_auto] flex-col overflow-hidden rounded-lg border border-border bg-surface">
          <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-h2 text-text-black">Leave Conversion Request</h2>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 sm:p-5">
            <TextAreaField
              label="Conversion Reason"
              value={conversionReason}
              onChange={setConversionReason}
              placeholder="Enter reason for converting to Emergency Leave"
              rows={3}
              error={
                triedSubmit && reasonMissing
                  ? 'Conversion reason is required.'
                  : null
              }
            />
            <DropzoneFileField
              label="Attachment"
              files={attachments}
              onChange={setAttachments}
              onUploadingChange={setAttachmentUploading}
              accept={ATTACHMENT_ACCEPT}
              multiple={false}
              className="min-h-0"
            />
            {submitNotice ? (
              <div
                className="flex shrink-0 gap-2 rounded-md border-2 border-status-pending bg-status-pending/15 px-3 py-2.5"
                role="alert"
              >
                <TriangleAlert
                  className="mt-0.5 size-4 shrink-0 text-status-pending"
                  aria-hidden="true"
                />
                <p className="text-small font-semibold text-text-black">
                  {submitNotice}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            onClick={() => navigate(detailsPath)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit}
            title={
              attachmentUploading
                ? 'Wait for the attachment upload to finish.'
                : reasonMissing
                  ? 'Enter a conversion reason before confirming.'
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
        onConfirm={handleConfirmConversion}
        title="Confirm leave conversion"
        description="Are you sure you want to convert this confirmed leave request?"
        requireReason={false}
        confirmLabel="Submit conversion"
        cancelLabel="Cancel"
        confirmVariant="primary"
        iconVariant="conversion"
      />
    </div>
  )
}

export function ConvertEmergencyLeaveRequestPage() {
  const { leaveRequestId } = useParams<{ leaveRequestId: string }>()
  const { user } = useAuth()
  const leaveId = Number(leaveRequestId)
  const validId = Number.isInteger(leaveId) && leaveId > 0

  const { data: detail, error, isLoading } = useLeaveDetail(
    validId ? leaveId : null,
  )

  const convertible = useMemo(() => {
    if (!detail) return false
    return canRequestConversion(detail, user.id)
  }, [detail, user.id])

  const detailsPath = detail
    ? `/my-leave/requests/${detail.id}`
    : '/dashboard'

  const notFound =
    !validId ||
    (error instanceof ApiError && error.status === 404) ||
    (!isLoading && !detail && error != null)

  if (isLoading) {
    return (
      <FormPageLoadingView
        backTo="/dashboard"
        backLabel="Back to Dashboard"
        title="Convert to Emergency Leave"
        sections={[
          {
            heading: 'Leave Conversion Request',
            fields: [
              { label: 'Conversion Reason', span: 2 },
              { label: 'Attachment', span: 2 },
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
            Open a request from your dashboard list to convert it.
          </p>
        </div>
      </div>
    )
  }

  if (!convertible) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <Link
          to={detailsPath}
          className="text-body inline-flex w-fit items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Leave Request
        </Link>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h1 className="text-h1 text-text-black">Conversion not available</h1>
          <p className="mt-2 text-body text-text-gray">
            Only your own confirmed Vacation Leave (with no conversion yet) can
            be converted to Emergency Leave.
          </p>
        </div>
      </div>
    )
  }

  return <ConvertEmergencyLeaveForm detail={detail} />
}
