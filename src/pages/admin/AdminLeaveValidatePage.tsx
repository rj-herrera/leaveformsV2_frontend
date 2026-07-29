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
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { DetailPageSkeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import { TABLE_ACTION_BUTTON_CLASS } from '../../components/ui/tableStyles'
import { shouldShowDataSkeleton } from '../../mocks/config'
import { getLeaveRequestDetail } from '../../mocks/leaveRequests'
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
  const [previewFileName, setPreviewFileName] = useState('')

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
    return <DetailPageSkeleton />
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

  function openPreview(fileName: string) {
    setPreviewFileName(fileName)
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
          <InfoCell label="Employee Name" value={detail.requesterName} />
          <InfoCell
            label="Employee No."
            value={detail.employeeNumber}
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
          <article className="flex flex-col justify-center rounded-lg border border-border bg-surface p-4">
            <h2 className="text-h2 text-text-black">Original Leave Request</h2>
            <dl className="mt-3 space-y-2.5">
              <InfoRow label="Leave Type" value={conversion.originalLeaveType} />
              <InfoRow label="Date Filed" value={conversion.originalDateFiled} />
              <InfoRow
                label="Actual Leave Period"
                value={conversion.originalLeavePeriod}
              />
              <InfoRow label="Filed By" value={conversion.filedBy} />
              <InfoRow label="Reason" value={conversion.originalReason} />
              <InfoRow
                label="Attachment"
                value={conversion.originalAttachment ?? '—'}
              />
            </dl>
          </article>

          <article className="flex flex-col justify-center rounded-lg border border-border bg-surface p-4">
            <h2 className="text-h2 text-text-black">Leave Conversion Request</h2>
            <dl className="mt-3 space-y-2.5">
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <dt className="text-small text-text-gray">Attachment</dt>
                  <dd className="mt-0.5 text-body text-text-black">
                    {conversion.conversionAttachment ?? '—'}
                  </dd>
                </div>
                {conversion.conversionAttachment ? (
                  <button
                    type="button"
                    onClick={() => openPreview(conversion.conversionAttachment!)}
                    className={TABLE_ACTION_BUTTON_CLASS}
                  >
                    View
                  </button>
                ) : null}
              </div>
            </dl>
          </article>
        </section>
      ) : (
        <article className="shrink-0 rounded-lg border border-border bg-surface p-4">
          <h2 className="text-h2 text-text-black">Leave Request Summary</h2>
          <dl className="mt-3 space-y-2.5">
            <InfoRow label="Date Filed" value={detail.dateFiled} />
            <InfoRow label="Leave Period" value={detail.leavePeriod} />
            <InfoRow label="Duration" value={detail.duration} />
            <InfoRow label="Reason" value={detail.reason} />
          </dl>
        </article>
      )}

      <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="shrink-0 border-b border-border px-5 py-3">
          <h2 className="text-h2 text-text-black">Approvers</h2>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-border text-small text-text-gray">
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Approver</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Action Date</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {detail.approvers.map((approver) => {
                const isYou = approver.id === user.id
                return (
                  <tr
                    key={`${approver.id}-${approver.purpose ?? 'default'}`}
                    className="border-b border-border/60 text-body text-text-black last:border-b-0"
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
                      <ApproverStatus status={approver.status} />
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
          <button
            type="button"
            onClick={() => setRejectOpen(true)}
            className="rounded-md border border-border bg-surface px-4 py-2.5 text-body font-medium text-text-black transition-colors hover:bg-surface-muted"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => setApproveOpen(true)}
            className="rounded-md border border-border bg-surface-muted px-4 py-2.5 text-body font-medium text-text-black transition-colors hover:bg-background"
          >
            Approve
          </button>
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
        fileName={previewFileName}
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
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-small text-text-gray">{label}</dt>
      <dd className="text-body text-text-black sm:text-right">{value}</dd>
    </div>
  )
}

function ApproverStatus({
  status,
}: {
  status: 'approved' | 'rejected' | 'no_action'
}) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-status-approved">
        <CheckCircle2 className="size-4" aria-hidden="true" />
        Approved
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-status-rejected">
        <XCircle className="size-4" aria-hidden="true" />
        Rejected
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
