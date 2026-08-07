import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
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
import {
  getLeaveRequestDetail,
  isApproverActionable,
} from '../../mocks/leaveRequests'
import {
  attachmentFilesFromNames,
  parseAttachmentFileNames,
  type AttachmentFile,
} from '../../utils/attachments'
import {
  listPathWithTab,
  listTabFromLocationState,
} from '../../utils/listTab'

export function LeaveRequestReviewPage() {
  const { leaveRequestId } = useParams<{ leaveRequestId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const detail = getLeaveRequestDetail(leaveRequestId)
  const showSkeleton = shouldShowDataSkeleton()
  const listTab = listTabFromLocationState(
    location.state,
    location.pathname.includes('/leave-requests/') ? 'all' : 'pending',
  )
  const backToApprovals = listPathWithTab('/team/leave-approvals', listTab)

  const routeWantsReview = location.pathname.includes('/leave-approvals/')
  const canAct = useMemo(() => {
    if (!detail) return false
    return isApproverActionable(detail, user.id)
  }, [detail, user.id])
  const isReviewMode = routeWantsReview && canAct

  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [successKind, setSuccessKind] = useState<'approve' | 'reject'>(
    'approve',
  )
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFiles, setPreviewFiles] = useState<AttachmentFile[]>([])

  if (showSkeleton) {
    return (
      <LeaveDetailLoadingView
        backTo={backToApprovals}
        backLabel="Back to Leave Approvals"
      />
    )
  }

  if (!detail) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <Link
          to={backToApprovals}
          className="text-body inline-flex w-fit items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Leave Approvals
        </Link>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h1 className="text-h1 text-text-black">Leave request not found</h1>
          <p className="mt-2 text-body text-text-gray">
            No mock details exist for ID{' '}
            <span className="font-semibold text-text-black">
              {leaveRequestId ?? 'unknown'}
            </span>
            .
          </p>
        </div>
      </div>
    )
  }

  const decisionSettled =
    detail.status === 'APPROVED' || detail.status === 'REJECTED'

  function openPreview(attachmentValue: string | null | undefined) {
    const files = attachmentFilesFromNames(attachmentValue)
    if (files.length === 0) return
    setPreviewFiles(files)
    setPreviewOpen(true)
  }

  function handleRejectConfirm(reason: string) {
    // TODO(REPLACE): POST reject with reason to API
    void reason
    setRejectOpen(false)
    setSuccessKind('reject')
    setSuccessOpen(true)
  }

  function handleApproveConfirm(_reason: string) {
    // TODO(REPLACE): POST approve to API
    void _reason
    setApproveOpen(false)
    setSuccessKind('approve')
    setSuccessOpen(true)
  }

  function handleSuccessClose() {
    setSuccessOpen(false)
    navigate(backToApprovals)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <Link
        to={backToApprovals}
        className="text-body inline-flex w-fit shrink-0 items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Leave Approvals
      </Link>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <h1 className="text-h1 text-text-black">{detail.leaveType}</h1>
        <StatusBadge status={detail.status} />
      </div>

      <section className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch">
        <article className="flex flex-col rounded-lg border border-border bg-surface p-4">
          <h2 className="text-h2 text-text-black">Employee Information</h2>
          <dl className={`mt-3 ${INFO_FIELD_GRID_CLASS}`}>
            <InfoRow label="Employee No." value={detail.employeeNumber} />
            <InfoRow label="Employee Name" value={detail.requesterName} />
            <InfoRow label="Department" value={detail.department} />
            <InfoRow label="Group" value={detail.groupLabel} />
          </dl>
        </article>

        <article className="flex flex-col rounded-lg border border-border bg-surface p-4">
          <h2 className="text-h2 text-text-black">Leave Request Summary</h2>
          <dl className={`mt-3 ${INFO_FIELD_GRID_CLASS}`}>
            <InfoRow label="Date Filed" value={detail.dateFiled} />
            <InfoRow label="Leave Period" value={detail.leavePeriod} />
            <InfoRow label="Duration" value={detail.duration} />
            <InfoRow label="Reason" value={detail.reason} />
            <AttachmentRow
              value={
                detail.conversion
                  ? detail.conversion.conversionAttachment
                  : detail.attachmentFileName
              }
              alwaysShow={Boolean(detail.conversion)}
              onView={() =>
                openPreview(
                  detail.conversion
                    ? detail.conversion.conversionAttachment
                    : detail.attachmentFileName,
                )
              }
            />
          </dl>
        </article>
      </section>

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
                          <span className="rounded bg-primary px-1.5 py-0.5 text-header tracking-[0.08em] text-white uppercase">
                            You
                          </span>
                        ) : null}
                      </span>
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
                )
              })}
            </tbody>
          </table>
        </div>
      </article>

      {isReviewMode ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button type="button" onClick={() => setRejectOpen(true)}>
            Reject
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => setApproveOpen(true)}
          >
            Approve
          </Button>
        </div>
      ) : null}

      <ConfirmReasonModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleRejectConfirm}
        title="Reject leave request"
        description="Please provide a reason for rejecting this leave request."
        reasonLabel="Rejection reason"
        reasonPlaceholder="Why are you rejecting this request?"
        confirmLabel="Reject request"
        cancelLabel="Go back"
        confirmVariant="danger"
      />

      <ConfirmReasonModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={handleApproveConfirm}
        title="Approve leave request"
        description="Are you sure you want to approve this leave request?"
        requireReason={false}
        confirmLabel="Approve request"
        cancelLabel="Go back"
        confirmVariant="primary"
      />

      <SuccessDialog
        open={successOpen}
        onClose={handleSuccessClose}
        title={
          successKind === 'approve' ? 'Request approved' : 'Request rejected'
        }
        message={
          successKind === 'approve'
            ? 'The leave request has been approved successfully.'
            : 'The leave request has been rejected successfully.'
        }
        confirmLabel="Back to Leave Approvals"
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
  alwaysShow = false,
}: {
  value: string | null | undefined
  onView: () => void
  /** Sick Leave Conversion requires supporting attachments — always show the row. */
  alwaysShow?: boolean
}) {
  const fileCount = parseAttachmentFileNames(value).length
  if (fileCount === 0 && !alwaysShow) return null

  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-small text-text-gray">Attachment</dt>
      <dd>
        {fileCount > 0 ? (
          <Button type="button" size="sm" onClick={onView}>
            View
          </Button>
        ) : (
          <span className="text-body text-text-gray">—</span>
        )}
      </dd>
    </div>
  )
}
