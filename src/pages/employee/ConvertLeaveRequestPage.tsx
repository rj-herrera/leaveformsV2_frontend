import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { FileField } from '../../components/ui/form/FileField'
import { TextAreaField } from '../../components/ui/form/TextAreaField'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import { DetailPageSkeleton } from '../../components/ui/Skeleton'
import { shouldShowDataSkeleton } from '../../mocks/config'
import {
  getLeaveRequestDetail,
  submitVlToSlConversion,
} from '../../mocks/leaveRequests'

export function ConvertLeaveRequestPage() {
  const { leaveRequestId } = useParams<{ leaveRequestId: string }>()
  const navigate = useNavigate()
  const detail = getLeaveRequestDetail(leaveRequestId)
  const showSkeleton = shouldShowDataSkeleton()

  const [conversionReason, setConversionReason] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  const canConvert = useMemo(() => {
    if (!detail) return false
    return (
      detail.status === 'APPROVED' &&
      detail.leaveType === 'Vacation Leave' &&
      !detail.conversion
    )
  }, [detail])

  if (showSkeleton) {
    return <DetailPageSkeleton />
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
        </div>
      </div>
    )
  }

  const requestId = detail.id
  const detailsPath = `/my-leave/requests/${requestId}`

  if (!canConvert) {
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
            Only approved Vacation Leave requests can be converted to Sick Leave.
          </p>
        </div>
      </div>
    )
  }

  const reasonMissing = conversionReason.trim().length === 0
  const attachmentMissing = attachments.length === 0
  const canSubmit =
    !reasonMissing && !attachmentMissing && !attachmentUploading

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTriedSubmit(true)
    if (!canSubmit || attachments.length === 0 || attachmentUploading) return
    setConfirmOpen(true)
  }

  function handleConfirmConversion() {
    if (attachments.length === 0) return

    // TODO(REPLACE): POST VL → SL conversion to API
    submitVlToSlConversion(requestId, {
      reason: conversionReason.trim(),
      attachmentFileName: attachments.map((file) => file.name).join(', '),
    })

    setConfirmOpen(false)
    setSuccessOpen(true)
  }

  function handleSuccessClose() {
    setSuccessOpen(false)
    navigate(detailsPath)
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
        <h1 className="shrink-0 text-h1 text-text-black">Convert to Sick Leave</h1>

        <section className="shrink-0 rounded-lg border border-border bg-surface p-4 sm:p-5">
          <h2 className="text-h2 text-text-black">Leave Conversion Request</h2>
          <div className="mt-4 grid gap-4">
            <TextAreaField
              label="Reason for converting to Sick Leave"
              value={conversionReason}
              onChange={setConversionReason}
              placeholder="Explain why this approved Vacation Leave should become Sick Leave"
              rows={3}
            />
            {triedSubmit && reasonMissing ? (
              <p className="-mt-2 text-small text-status-rejected" role="alert">
                Conversion reason is required.
              </p>
            ) : null}
            <FileField
              label="Supporting attachment (medical certificate)"
              files={attachments}
              onChange={setAttachments}
              onUploadingChange={setAttachmentUploading}
              accept="image/*,.pdf"
              required
              multiple
              maxFiles={5}
              hint="Required. Upload a medical certificate or other supporting document. You can attach up to 5 files."
              error={
                triedSubmit && attachmentMissing
                  ? 'An attachment is required to submit a conversion request.'
                  : null
              }
            />
          </div>
        </section>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button type="button" onClick={() => navigate(detailsPath)}>
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
                  : attachmentMissing
                    ? 'Upload a supporting attachment before confirming.'
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
        description="Are you sure you want to convert this approved Vacation Leave to Sick Leave? Admin validation will be required."
        requireReason={false}
        confirmLabel="Submit conversion"
        cancelLabel="Go back"
        confirmVariant="primary"
      />

      <SuccessDialog
        open={successOpen}
        onClose={handleSuccessClose}
        title="Conversion submitted"
        message="Your leave conversion request has been submitted successfully and is awaiting Admin validation."
        confirmLabel="Back to request"
      />
    </div>
  )
}
