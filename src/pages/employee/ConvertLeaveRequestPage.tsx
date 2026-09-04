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
import { DropzoneFileField } from '../../components/ui/form/DropzoneFileField'
import { TextAreaField } from '../../components/ui/form/TextAreaField'
import { FormPageLoadingView } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/ToastProvider'
import { useLeaveDetail } from '../../hooks/api/useLeaveDetail'
import { isLeaveListKey, swrKeys } from '../../hooks/api/swrKeys'
import { canRequestConversion } from '../../utils/leaveConversion'
import {
  ATTACHMENT_MAX_FILES,
  attachmentFieldHint,
  MED_CERT_ACCEPT,
} from '../../utils/leaveFiling'
// File size validation disabled for now; re-enable if API enforces a max again:
// const MED_CERT_MAX_BYTES = 5120 * 1024

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

function reasonErrorFromApi(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null
  const body = error.body
  if (body && typeof body === 'object' && 'errors' in body) {
    const errors = (body as { errors: Record<string, string[]> }).errors
    const first = errors.reason?.[0]
    if (typeof first === 'string' && first.trim()) return first.trim()
  }
  return null
}

type ConvertLeaveFormProps = {
  detail: LeaveDetail
}

function ConvertLeaveForm({ detail }: ConvertLeaveFormProps) {
  const navigate = useNavigate()
  const { mutate } = useSWRConfig()
  const toast = useToast()
  const detailsPath = `/my-leave/requests/${detail.id}`

  const [attachments, setAttachments] = useState<File[]>([])
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonApiError, setReasonApiError] = useState<string | null>(null)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const attachmentMissing = attachments.length === 0
  const reasonMissing = reason.trim().length === 0
  const canSubmit =
    !attachmentMissing &&
    !reasonMissing &&
    !attachmentUploading &&
    !submitting

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTriedSubmit(true)
    setSubmitError(null)
    setReasonApiError(null)
    if (!canSubmit) return
    setConfirmOpen(true)
  }

  async function handleConfirmConversion() {
    if (attachmentMissing || reasonMissing) return

    setConfirmOpen(false)
    setSubmitting(true)
    setSubmitError(null)
    setReasonApiError(null)

    try {
      await requestConversion(detail.id, attachments, reason.trim())

      // Navigate before leave-detail revalidation so the parent gate does not
      // briefly show "Conversion not available" after status becomes pending.
      toast.success('Leave conversion submitted successfully.')
      navigate('/dashboard')

      void Promise.all([
        mutate(swrKeys.leave(detail.id)),
        mutate(isLeaveListKey, undefined, { revalidate: true }),
        mutate(swrKeys.balances()),
      ])
    } catch (error) {
      const reasonError = reasonErrorFromApi(error)
      if (reasonError) setReasonApiError(reasonError)
      else setSubmitError(messageFromApiError(error))
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

        <section className="flex min-h-0 flex-[0_1_auto] flex-col overflow-hidden rounded-lg border border-border bg-surface">
          <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-h2 text-text-black">Leave Conversion Request</h2>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-5">
            <TextAreaField
              label="Conversion Reason"
              value={reason}
              onChange={(value) => {
                setReason(value)
                if (reasonApiError) setReasonApiError(null)
              }}
              placeholder="Enter reason for converting to Sick Leave"
              rows={3}
              className="shrink-0"
              error={
                triedSubmit && reasonMissing
                  ? 'Conversion reason is required.'
                  : reasonApiError
              }
            />
            <DropzoneFileField
              label="Supporting Files"
              files={attachments}
              onChange={setAttachments}
              onUploadingChange={setAttachmentUploading}
              accept={MED_CERT_ACCEPT}
              required
              maxFiles={ATTACHMENT_MAX_FILES}
              hint={attachmentFieldHint()}
              className="min-h-0"
              error={
                triedSubmit && attachmentMissing
                  ? 'At least one medical certificate is required to submit a conversion request.'
                  : null
              }
            />
            {submitError ? (
              <div
                className="flex shrink-0 gap-2 rounded-md border-2 border-status-rejected bg-status-rejected/10 px-3 py-2.5"
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
            loading={submitting}
            loadingText="Submitting…"
            title={
              attachmentUploading
                ? 'Wait for the attachment upload to finish.'
                : reasonMissing
                  ? 'Enter a conversion reason before confirming.'
                  : attachmentMissing
                    ? 'Upload at least one medical certificate before confirming.'
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
          void handleConfirmConversion()
        }}
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

export function ConvertLeaveRequestPage() {
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
        title="Convert to Sick Leave"
        sections={[
          {
            heading: 'Leave Conversion Request',
            fields: [
              { label: 'Conversion Reason', span: 2 },
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
            Only your own confirmed Vacation Leave (with no pending or approved
            conversion) can be converted to Sick Leave.
          </p>
        </div>
      </div>
    )
  }

  return <ConvertLeaveForm detail={detail} />
}
