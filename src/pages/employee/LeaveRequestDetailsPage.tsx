import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Pencil,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react'
import { AttachmentPreviewModal } from '../../components/ui/AttachmentPreviewModal'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { LeaveDetailLoadingView } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import { TABLE_BODY_ROW_BORDER_CLASS, INFO_FIELD_GRID_CLASS } from '../../components/ui/tableStyles'
import { shouldShowDataSkeleton } from '../../mocks/config'
import { getLeaveRequestDetail } from '../../mocks/leaveRequests'
import {
  attachmentFilesFromNames,
  parseAttachmentFileNames,
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
        <Link
          to="/dashboard"
          className="text-body inline-flex w-fit items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Dashboard
        </Link>
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
      <Link
        to="/dashboard"
        className="text-body inline-flex w-fit shrink-0 items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Dashboard
      </Link>

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
        <section className="grid shrink-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
          <article className="flex flex-col rounded-lg border border-border bg-surface p-5">
            <h2 className="text-h2 text-text-black">Original Leave Request</h2>
            <dl className={`mt-4 ${INFO_FIELD_GRID_CLASS}`}>
              <InfoRow
                label="Leave Type"
                value={detail.conversion.originalLeaveType}
              />
              <InfoRow
                label="Day Type"
                value={detail.conversion.originalDayType}
              />
              <InfoRow
                label="Date Filed"
                value={detail.conversion.originalDateFiled}
              />
              <InfoRow
                label="Actual Leave Period"
                value={detail.conversion.originalLeavePeriod}
              />
              <InfoRow label="Filed By" value={detail.conversion.filedBy} />
              <InfoRow label="Reason" value={detail.conversion.originalReason} />
              <AttachmentRow
                value={detail.conversion.originalAttachment}
                onView={() => openPreview(detail.conversion!.originalAttachment)}
              />
            </dl>
          </article>

          <article className="flex flex-col rounded-lg border border-border bg-surface p-5">
            <h2 className="text-h2 text-text-black">Leave Conversion Request</h2>
            <dl className={`mt-4 ${INFO_FIELD_GRID_CLASS}`}>
              <InfoRow
                label="Requested Leave Type"
                value={detail.conversion.requestedLeaveType}
              />
              <InfoRow
                label="Date of Conversion Request"
                value={detail.conversion.conversionRequestDate}
              />
              <InfoRow
                label="Conversion Reason"
                value={detail.conversion.conversionReason}
              />
              <AttachmentRow
                value={detail.conversion.conversionAttachment}
                onView={() =>
                  openPreview(detail.conversion!.conversionAttachment)
                }
              />
            </dl>
          </article>
        </section>
      ) : (
        <article className="shrink-0 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-h2 text-text-black">Leave Information</h2>
          <dl className={`mt-4 ${INFO_FIELD_GRID_CLASS}`}>
            <InfoRow label="Date Filed" value={detail.dateFiled} />
            <InfoRow label="Leave Period" value={detail.leavePeriod} />
            <InfoRow label="Duration" value={detail.duration} />
            <InfoRow label="Reason" value={detail.reason} />
            <AttachmentRow
              value={detail.attachmentFileName}
              onView={() => openPreview(detail.attachmentFileName)}
            />
          </dl>
        </article>
      )}

      <article className="flex min-h-0 flex-[0_1_auto] flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="shrink-0 border-b border-border px-5 py-4">
          <h2 className="text-h2 text-text-black">Approval Details</h2>
        </div>

        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="sticky top-0 z-10 bg-surface-muted">
              <tr className="border-b border-border bg-surface-muted text-small text-text-gray">
                <th className="px-5 py-3 font-bold uppercase tracking-wide">
                  Approver
                </th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">
                  Purpose
                </th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">
                  Action Date
                </th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {detail.approvers.map((approver) => (
                <tr
                  key={`${approver.id}-${approver.purpose ?? 'default'}`}
                  className={`${TABLE_BODY_ROW_BORDER_CLASS} text-body text-text-black`}
                >
                  <td className="px-5 py-3.5">{approver.name}</td>
                  <td className="px-5 py-3.5 text-text-gray">
                    {approver.purpose ??
                      (approver.role === 'admin'
                        ? 'Admin validation'
                        : 'Leave approval')}
                  </td>
                  <td className="px-5 py-3.5">
                    {approver.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1.5 text-status-approved">
                        <CheckCircle2
                          className="size-4 fill-status-approved text-white"
                          aria-hidden="true"
                        />
                        Approved
                      </span>
                    ) : approver.status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1.5 text-status-rejected">
                        <XCircle
                          className="size-4 fill-status-rejected text-white"
                          aria-hidden="true"
                        />
                        Rejected
                      </span>
                    ) : decisionSettled ? (
                      <span className="inline-flex items-center gap-1.5 text-text-gray">
                        <Circle
                          className="size-3.5 fill-text-gray text-text-gray"
                          aria-hidden="true"
                        />
                        No action required
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-text-gray">
                        <Circle className="size-3.5" aria-hidden="true" />
                        No Action Yet
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-text-gray">
                    {approver.actionDate ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-text-gray">
                    {approver.remarks ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-small text-text-gray">{label}</dt>
      <dd className="text-body font-semibold text-text-black">{value}</dd>
    </div>
  )
}

function AttachmentRow({
  value,
  onView,
}: {
  value: string | null | undefined
  onView: () => void
}) {
  const fileCount = parseAttachmentFileNames(value).length
  if (fileCount === 0) return null

  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-small text-text-gray">Attachment</dt>
      <dd>
        <Button type="button" size="sm" onClick={onView}>
          View
        </Button>
      </dd>
    </div>
  )
}
