import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { ApprovalDetailsTable } from '../../components/leave/ApprovalDetailsTable'
import { LeaveAttachmentRow } from '../../components/leave/LeaveAttachmentRow'
import { LeaveConversionPanels } from '../../components/leave/LeaveConversionPanels'
import { LeaveInfoRow } from '../../components/leave/LeaveInfoRow'
import { AttachmentPreviewModal } from '../../components/ui/AttachmentPreviewModal'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { PageBackLink } from '../../components/ui/PageBackLink'
import { LeaveDetailLoadingView } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import { INFO_FIELD_GRID_CLASS } from '../../components/ui/tableStyles'
import { shouldShowDataSkeleton } from '../../mocks/config'
import { getLeaveRequestDetail } from '../../mocks/leaveRequests'
import {
  attachmentFilesFromNames,
  type AttachmentFile,
} from '../../utils/attachments'

export function LeaveRequestDetailsPage() {
  const { leaveRequestId } = useParams<{ leaveRequestId: string }>()
  const navigate = useNavigate()
  const detail = getLeaveRequestDetail(leaveRequestId)
  const showSkeleton = shouldShowDataSkeleton()

  const [cancelOpen, setCancelOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFiles, setPreviewFiles] = useState<AttachmentFile[]>([])

  if (showSkeleton) {
    return (
      <LeaveDetailLoadingView
        backTo="/dashboard"
        backLabel="Back to Dashboard"
      />
    )
  }

  if (!detail) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageBackLink to="/dashboard">Back to Dashboard</PageBackLink>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h1 className="text-h1 text-text-black">Leave request not found</h1>
          <p className="text-body text-text-gray mt-2">
            No mock details exist for ID{' '}
            <span className="font-semibold text-text-black">
              {leaveRequestId ?? 'unknown'}
            </span>
            . Open a request from the dashboard list for the current role.
          </p>
        </div>
      </div>
    )
  }

  const isConversion =
    detail.status === 'PENDING_CONVERSION' && detail.conversion
  const hasApproverAction = detail.approvers.some(
    (approver) =>
      approver.status === 'approved' || approver.status === 'rejected',
  )
  const canEdit =
    !isConversion && !hasApproverAction && detail.status === 'PENDING'
  const canCancel =
    detail.status === 'PENDING' || detail.status === 'PENDING_CONVERSION'
  const canConvertToSick =
    detail.status === 'APPROVED' &&
    detail.leaveType === 'Vacation Leave' &&
    !detail.conversion
  const decisionSettled =
    detail.status === 'APPROVED' || detail.status === 'REJECTED'

  function openPreview(attachmentValue: string | null | undefined) {
    const files = attachmentFilesFromNames(attachmentValue)
    if (files.length === 0) return
    setPreviewFiles(files)
    setPreviewOpen(true)
  }

  function handleCancelConfirm(_reason: string) {
    // TODO(REPLACE): POST cancel with reason to API for detail.id
    void _reason
    setCancelOpen(false)
    setSuccessOpen(true)
  }

  function handleSuccessClose() {
    setSuccessOpen(false)
    navigate('/dashboard')
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <PageBackLink to="/dashboard">Back to Dashboard</PageBackLink>

      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h1 text-text-black">{detail.leaveType}</h1>
          <StatusBadge status={detail.status} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canConvertToSick ? (
            <Link
              to={`/my-leave/requests/${detail.id}/convert`}
              className="inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-3 py-2 text-body font-medium text-white transition-opacity hover:opacity-90"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Convert to Sick Leave
            </Link>
          ) : canEdit ? (
            <Link
              to={`/my-leave/requests/${detail.id}/edit`}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-body font-medium text-text-black transition-colors hover:bg-surface-muted"
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit Request
            </Link>
          ) : (
            <Button
              type="button"
              disabled
              title={
                isConversion
                  ? 'Editing is not available during leave conversion'
                  : 'Editing is disabled after an approver has taken action'
              }
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit Request
            </Button>
          )}

          <Button
            type="button"
            disabled={!canCancel}
            onClick={() => setCancelOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Cancel Request
          </Button>
        </div>
      </div>

      {isConversion && detail.conversion ? (
        <LeaveConversionPanels
          conversion={detail.conversion}
          onPreview={openPreview}
          spacing="comfortable"
        />
      ) : (
        <article className="shrink-0 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-h2 text-text-black">Leave Information</h2>
          <dl className={`mt-4 ${INFO_FIELD_GRID_CLASS}`}>
            <LeaveInfoRow label="Date Filed" value={detail.dateFiled} />
            <LeaveInfoRow label="Leave Period" value={detail.leavePeriod} />
            <LeaveInfoRow label="Duration" value={detail.duration} />
            <LeaveInfoRow label="Reason" value={detail.reason} />
            <LeaveAttachmentRow
              value={detail.attachmentFileName}
              onView={() => openPreview(detail.attachmentFileName)}
            />
          </dl>
        </article>
      )}

      <ApprovalDetailsTable
        approvers={detail.approvers}
        decisionSettled={decisionSettled}
        showPurpose
        headerClassName="shrink-0 border-b border-border px-5 py-4"
      />

      <ConfirmReasonModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel leave request"
        description="This will cancel the leave request. Please provide a cancellation reason."
        reasonLabel="Cancellation reason"
        reasonPlaceholder="Why are you cancelling this request?"
        confirmLabel="Cancel request"
        cancelLabel="Keep request"
        confirmVariant="danger"
      />

      <SuccessDialog
        open={successOpen}
        onClose={handleSuccessClose}
        title="Request cancelled"
        message="Your leave request has been cancelled successfully."
        confirmLabel="Back to dashboard"
      />

      <AttachmentPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        files={previewFiles}
      />
    </div>
  )
}

