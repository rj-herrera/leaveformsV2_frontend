import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { ApiError } from '../../api/axios-client'
import { requestConversion } from '../../api/conversions'
import type { LeaveDetail } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { FileField } from '../../components/ui/form/FileField'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import { FormPageLoadingView } from '../../components/ui/Skeleton'
import { useLeaveDetail } from '../../hooks/api/useLeaveDetail'
import { isLeaveListKey, swrKeys } from '../../hooks/api/swrKeys'

/** API: pdf / jpg / jpeg / png, max 5120 KB. */
const MED_CERT_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'
const MED_CERT_MAX_BYTES = 5120 * 1024

function messageFromApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body
    if (body && typeof body === 'object' && 'errors' in body) {
      const errors = (body as { errors: Record<string, string[]> }).errors
      const first = Object.values(errors).flat()[0]
      if (typeof first === 'string' && first.length > 0) return first
    }
    if (error.message) return error.message
  }
  return 'Unable to submit conversion request. Please try again.'
}

/** Confirmed VL, no conversion yet, and viewer is the employee on leave. */
function canRequestConversion(
  detail: LeaveDetail,
  viewerEmpId: string,
): boolean {
  if (detail.status !== 'confirmed') return false
  if (detail.leave_type.code.toUpperCase() !== 'VL') return false
  if (detail.conversion != null) return false
  return String(detail.emp_id) === String(viewerEmpId)
}

type ConvertLeaveFormProps = {
  detail: LeaveDetail
  /** Called after a successful API submit (parent owns success dialog). */
  onSubmitted: () => void
}

function ConvertLeaveForm({ detail, onSubmitted }: ConvertLeaveFormProps) {
  const navigate = useNavigate()
  const { mutate } = useSWRConfig()
  const detailsPath = `/my-leave/requests/${detail.id}`

  const [attachments, setAttachments] = useState<File[]>([])
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const medCert = attachments[0] ?? null
  const attachmentMissing = medCert == null
  const fileTooLarge = medCert != null && medCert.size > MED_CERT_MAX_BYTES
  const canSubmit =
    !attachmentMissing &&
    !fileTooLarge &&
    !attachmentUploading &&
    !submitting

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTriedSubmit(true)
    setSubmitError(null)
    if (!canSubmit) return
    setConfirmOpen(true)
  }

  async function handleConfirmConversion() {
    if (!medCert) return

    setConfirmOpen(false)
    setSubmitting(true)
    setSubmitError(null)

    try {
      await requestConversion(detail.id, medCert)

      // Signal success first so parent keeps success UI even after detail
      // revalidates to pending_conversion (convertible becomes false).
      onSubmitted()

      await Promise.all([
        mutate(swrKeys.leave(detail.id)),
        mutate(isLeaveListKey, undefined, { revalidate: true }),
        mutate(swrKeys.balances()),
      ])
    } catch (error) {
      setSubmitError(messageFromApiError(error))
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
        <h1 className="shrink-0 text-h1 text-text-black">
          Convert to Sick Leave
        </h1>

        <section className="shrink-0 rounded-lg border border-border bg-surface p-4 sm:p-5">
          <h2 className="text-h2 text-text-black">Leave Conversion Request</h2>
          <p className="mt-1 text-small text-text-gray">
            Upload a medical certificate. Admin validation is required before
            the leave becomes Sick Leave.
          </p>
          <div className="mt-4 grid gap-4">
            <FileField
              label="Medical certificate"
              files={attachments}
              onChange={setAttachments}
              onUploadingChange={setAttachmentUploading}
              accept={MED_CERT_ACCEPT}
              required
              multiple={false}
              hint="Required. PDF, JPG, or PNG — max 5 MB."
              error={
                triedSubmit && attachmentMissing
                  ? 'A medical certificate is required to submit a conversion request.'
                  : triedSubmit && fileTooLarge
                    ? 'File must be 5 MB or smaller.'
                    : null
              }
            />
            {submitError ? (
              <div
                className="flex gap-2 rounded-md border-2 border-status-rejected bg-status-rejected/10 px-3 py-2.5"
                role="alert"
              >
                <TriangleAlert
                  className="mt-0.5 size-4 shrink-0 text-status-rejected"
                  aria-hidden="true"
                />
                <p className="text-small font-semibold text-status-rejected">
                  {submitError}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            onClick={() => navigate(detailsPath)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit}
            title={
              submitting
                ? 'Submitting…'
                : attachmentUploading
                  ? 'Wait for the attachment upload to finish.'
                  : attachmentMissing
                    ? 'Upload a medical certificate before confirming.'
                    : fileTooLarge
                      ? 'File must be 5 MB or smaller.'
                      : undefined
            }
          >
            {submitting ? 'Submitting…' : 'Confirm'}
          </Button>
        </div>
      </form>

      <ConfirmReasonModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          void handleConfirmConversion()
        }}
        title="Confirm leave conversion"
        description="Are you sure you want to convert this confirmed Vacation Leave to Sick Leave? Admin validation will be required."
        requireReason={false}
        confirmLabel="Submit conversion"
        cancelLabel="Go back"
        confirmVariant="primary"
      />
    </div>
  )
}

export function ConvertLeaveRequestPage() {
  const { leaveRequestId } = useParams<{ leaveRequestId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const leaveId = Number(leaveRequestId)
  const validId = Number.isInteger(leaveId) && leaveId > 0

  const { data: detail, error, isLoading } = useLeaveDetail(
    validId ? leaveId : null,
  )

  const [successOpen, setSuccessOpen] = useState(false)

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

  function handleSuccessClose() {
    setSuccessOpen(false)
    navigate(detailsPath)
  }

  if (isLoading) {
    return (
      <FormPageLoadingView
        backTo="/dashboard"
        backLabel="Back to Dashboard"
        title="Convert to Sick Leave"
        sections={[
          {
            heading: 'Leave Conversion Request',
            fields: [
              { label: 'Medical certificate', span: 2 },
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

  // Success owns the screen after submit — even when leave is no longer convertible.
  if (successOpen) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
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
            be converted to Sick Leave.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ConvertLeaveForm
      detail={detail}
      onSubmitted={() => setSuccessOpen(true)}
    />
  )
}
