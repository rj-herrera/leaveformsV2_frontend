import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  X,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
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
import {
  listPathWithTab,
  listTabFromLocationState,
} from '../../utils/listTab'

export function AdminLeaveValidatePage() {
  const { leaveRequestId } = useParams<{ leaveRequestId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const detail = getLeaveRequestDetail(leaveRequestId)
  const showSkeleton = shouldShowDataSkeleton()
  const listTab = listTabFromLocationState(location.state, 'pending')
  const backToList = listPathWithTab('/admin/leave-requests', listTab)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [successKind, setSuccessKind] = useState<'approve' | 'reject'>(
    'approve',
  )
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFiles, setPreviewFiles] = useState<AttachmentFile[]>([])

  const canAct = useMemo(() => {
    if (!detail) return false
    return (
      detail.status === 'PENDING_CONVERSION' &&
      detail.approvers.some(
        (row) =>
          row.id === user.id &&
          row.role === 'admin' &&
          row.status === 'no_action',
      )
    )
  }, [detail, user.id])

  if (showSkeleton) {
    return (
      <LeaveDetailLoadingView
        backTo={backToList}
        backLabel="Back to Leave Requests"
      />
    )
  }

  if (!detail) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <Link
          to={backToList}
          className="text-body inline-flex w-fit items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Leave Requests
        </Link>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h1 className="text-h1 text-text-black">Leave request not found</h1>
          <p className="mt-2 text-body text-text-gray">
            No details exist for ID{' '}
            <span className="font-semibold text-text-black">
              {leaveRequestId ?? 'unknown'}
            </span>
            .
          </p>
        </div>
      </div>
    )
  }

  const conversion = detail.conversion
  const decisionSettled =
    detail.status === 'APPROVED' || detail.status === 'REJECTED'

  function openPreview(attachmentValue: string | null | undefined) {
    const files = attachmentFilesFromNames(attachmentValue)
    if (files.length === 0) return
    setPreviewFiles(files)
    setPreviewOpen(true)
  }

  function handleRejectConfirm(reason: string) {
    // TODO(REPLACE): POST admin reject conversion
    void reason
    setRejectOpen(false)
    setSuccessKind('reject')
    setSuccessOpen(true)
  }

  function handleApproveConfirm(_reason: string) {
    // TODO(REPLACE): POST admin approve conversion
    void _reason
    setApproveOpen(false)
    setSuccessKind('approve')
    setSuccessOpen(true)
  }

  function handleSuccessClose() {
    setSuccessOpen(false)
    navigate(backToList)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <Link
        to={backToList}
        className="text-body inline-flex w-fit shrink-0 items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Leave Requests
      </Link>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <h1 className="text-h1 text-text-black">
          {conversion ? 'Leave Conversion Request' : detail.leaveType}
        </h1>
        <StatusBadge status={detail.status} label="PENDING VALIDATION" />
      </div>

      <article className="shrink-0 rounded-lg border border-border bg-surface px-5 py-4">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border">
          <InfoCell label="Employee No." value={detail.employeeNumber} />
          <InfoCell
            label="Employee Name"
            value={detail.requesterName}
            className="lg:pl-4"
          />
          <InfoCell
            label="Department"
            value={detail.department}
            className="lg:pl-4"
          />
          <InfoCell
            label="Group"
            value={detail.groupLabel}
            className="lg:pl-4"
          />
        </dl>
      </article>

      {conversion ? (
        <section className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch">
          <article className="flex flex-col rounded-lg border border-border bg-surface p-4">
            <h2 className="text-h2 text-text-black">Original Leave Request</h2>
            <dl className={`mt-3 ${INFO_FIELD_GRID_CLASS}`}>
              <InfoRow label="Leave Type" value={conversion.originalLeaveType} />
              <InfoRow label="Day Type" value={conversion.originalDayType} />
              <InfoRow label="Date Filed" value={conversion.originalDateFiled} />
              <InfoRow
                label="Actual Leave Period"
                value={conversion.originalLeavePeriod}
              />
              <InfoRow label="Filed By" value={conversion.filedBy} />
              <InfoRow label="Reason" value={conversion.originalReason} />
              <AttachmentRow
                value={conversion.originalAttachment}
                onView={() => openPreview(conversion.originalAttachment)}
              />
            </dl>
          </article>

          <article className="flex flex-col rounded-lg border border-border bg-surface p-4">
            <h2 className="text-h2 text-text-black">Leave Conversion Request</h2>
            <dl className={`mt-3 ${INFO_FIELD_GRID_CLASS}`}>
              <InfoRow
                label="Requested Leave Type"
                value={conversion.requestedLeaveType}
              />
              <InfoRow
                label="Date of Conversion Request"
                value={conversion.conversionRequestDate}
              />
              <InfoRow
                label="Conversion Reason"
                value={conversion.conversionReason}
              />
              <AttachmentRow
                value={conversion.conversionAttachment}
                onView={() => openPreview(conversion.conversionAttachment)}
              />
            </dl>
          </article>
        </section>
      ) : (
        <article className="shrink-0 rounded-lg border border-border bg-surface p-4">
          <h2 className="text-h2 text-text-black">Leave Request Summary</h2>
          <dl className={`mt-3 ${INFO_FIELD_GRID_CLASS}`}>
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
        <div className="shrink-0 border-b border-border px-5 py-3">
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
              {detail.approvers.map((approver) => {
                const isYou = approver.id === user.id
                return (
                  <tr
                    key={`${approver.id}-${approver.purpose ?? 'default'}`}
                    className={`${TABLE_BODY_ROW_BORDER_CLASS} text-body text-text-black`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {approver.name}
                        {isYou ? (
                          <span className="rounded bg-surface-muted px-1.5 py-0.5 text-header tracking-[0.08em] text-text-gray uppercase">
                            You
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <ApproverStatus
                        status={approver.status}
                        decisionSettled={decisionSettled}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-text-gray">
                      {approver.actionDate ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-text-gray">
                      {approver.remarks ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </article>

      {canAct ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button type="button" onClick={() => setRejectOpen(true)}>
            <X className="size-4 text-status-rejected" aria-hidden="true" />
            Reject
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => setApproveOpen(true)}
          >
            <Check className="size-4 text-white" aria-hidden="true" />
            Approve
          </Button>
        </div>
      ) : null}

      <ConfirmReasonModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleRejectConfirm}
        title="Reject leave conversion"
        description="Please provide a reason for rejecting this conversion request."
        confirmLabel="Reject"
        confirmVariant="danger"
      />

      <ConfirmReasonModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={handleApproveConfirm}
        requireReason={false}
        title="Approve leave conversion"
        description="Are you sure you want to approve this leave conversion request?"
        confirmLabel="Approve"
        confirmVariant="primary"
      />

      <SuccessDialog
        open={successOpen}
        onClose={handleSuccessClose}
        title={successKind === 'approve' ? 'Approved' : 'Rejected'}
        message={
          successKind === 'approve'
            ? 'Leave conversion request successfully approved.'
            : 'Leave conversion request has been rejected.'
        }
      />

      <AttachmentPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        files={previewFiles}
      />
    </div>
  )
}

function InfoCell({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-small text-text-gray">{label}</dt>
      <dd className="mt-0.5 text-body font-semibold text-text-black">{value}</dd>
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

function ApproverStatus({
  status,
  decisionSettled = false,
}: {
  status: 'approved' | 'rejected' | 'no_action'
  decisionSettled?: boolean
}) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-status-approved">
        <CheckCircle2
          className="size-4 fill-status-approved text-white"
          aria-hidden="true"
        />
        Approved
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-status-rejected">
        <XCircle
          className="size-4 fill-status-rejected text-white"
          aria-hidden="true"
        />
        Rejected
      </span>
    )
  }
  if (decisionSettled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-text-gray">
        <Circle
          className="size-4 fill-text-gray text-text-gray"
          aria-hidden="true"
        />
        No action required
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-text-gray">
      <Circle className="size-4" aria-hidden="true" />
      No Action Yet
    </span>
  )
}
