import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { AttachmentPreviewModal } from '../../components/ui/AttachmentPreviewModal'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { DetailPageSkeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import { shouldShowDataSkeleton } from '../../mocks/config'
import {
  canSendApproverReminder,
  getApprovalProgressLabel,
  getApprovalProgressPercent,
  getLeaveRequestDetail,
  type ApproverRow,
} from '../../mocks/leaveRequests'
import {
  listPathWithTab,
  listTabFromLocationState,
} from '../../utils/listTab'

export function AdminLeaveRequestViewPage() {
  const { leaveRequestId } = useParams<{ leaveRequestId: string }>()
  const location = useLocation()
  const { user } = useAuth()
  const detail = getLeaveRequestDetail(leaveRequestId)
  const showSkeleton = shouldShowDataSkeleton()
  const listTab = listTabFromLocationState(
    location.state,
    location.pathname.includes('/validate') ? 'pending' : 'all',
  )
  const backToList = listPathWithTab('/admin/leave-requests', listTab)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFileName, setPreviewFileName] = useState('')
  const [reminderTarget, setReminderTarget] = useState<ApproverRow | null>(
    null,
  )
  const [reminderSuccessOpen, setReminderSuccessOpen] = useState(false)

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

  const progressPercent = getApprovalProgressPercent(
    detail.approvalsCompleted,
    detail.approvalsRequired,
  )
  const isRejected = detail.status === 'REJECTED'
  const progressLabel = isRejected
    ? 'Rejected'
    : getApprovalProgressLabel(
        detail.approvalsCompleted,
        detail.approvalsRequired,
      )

  function openPreview(fileName: string) {
    setPreviewFileName(fileName)
    setPreviewOpen(true)
  }

  function handleReminderConfirm() {
    // TODO(REPLACE): POST reminder email to reminderTarget
    setReminderTarget(null)
    setReminderSuccessOpen(true)
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
        <h1 className="text-h1 text-text-black">{detail.leaveType}</h1>
        <StatusBadge
          status={detail.status}
          label={
            detail.status === 'PENDING_CONVERSION'
              ? 'PENDING REVIEW'
              : undefined
          }
        />
      </div>

      <section className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-3">
        <article className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-h2 text-text-black">Employee Information</h2>
          <dl className="mt-3 space-y-2.5">
            <InfoRow label="Employee No." value={detail.employeeNumber} />
            <InfoRow label="Employee Name" value={detail.requesterName} />
            <InfoRow label="Department" value={detail.department} />
            <InfoRow label="Group" value={detail.groupLabel} />
          </dl>
        </article>

        <article className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-h2 text-text-black">Leave Request Summary</h2>
          <dl className="mt-3 space-y-2.5">
            <InfoRow label="Date Filed" value={detail.dateFiled} />
            <InfoRow label="Leave Period" value={detail.leavePeriod} />
            <InfoRow label="Filed By" value={detail.requesterName} />
            <InfoRow label="Duration" value={detail.duration} />
            <InfoRow label="Reason" value={detail.reason} />
          </dl>
        </article>

        <article className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-h2 text-text-black">Approval Progress</h2>
          <p className="mt-2 text-small text-text-gray">{progressLabel}</p>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Approval progress"
          >
            <div
              className={[
                'h-full rounded-full transition-[width]',
                isRejected ? 'bg-status-rejected' : 'bg-primary',
              ].join(' ')}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <ul className="mt-3 space-y-2.5">
            {detail.requirements.map((requirement) => (
              <li
                key={requirement.id}
                className="flex items-center justify-between gap-3"
              >
                <span className="flex items-center gap-2 text-body text-text-black">
                  {isRejected ? (
                    <XCircle
                      className="size-4 shrink-0 fill-status-rejected text-white"
                      aria-hidden="true"
                    />
                  ) : requirement.status === 'completed' ? (
                    <CheckCircle2
                      className="size-4 shrink-0 text-status-approved"
                      aria-hidden="true"
                    />
                  ) : (
                    <Clock3
                      className="size-4 shrink-0 text-status-pending-conversion"
                      aria-hidden="true"
                    />
                  )}
                  {requirement.label}
                </span>
                <span
                  className={`text-small font-semibold ${
                    isRejected
                        ? 'text-status-rejected'
                        : requirement.status === 'completed'
                          ? 'text-status-approved'
                          : 'text-status-pending-conversion'
                  }`}
                >
                  {isRejected
                      ? 'Rejected'
                      : requirement.status === 'completed'
                        ? 'Completed'
                        : 'Pending'}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <article className="shrink-0 rounded-lg border border-border bg-surface px-4 py-3">
        <h2 className="text-h2 text-text-black">Attachments</h2>
        {detail.attachmentFileName ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-body font-semibold text-text-black">
                {detail.attachmentFileName}
              </p>
              <p className="text-small text-text-gray">Attachment</p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => openPreview(detail.attachmentFileName!)}
            >
              View
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-body text-text-gray italic">
            {detail.attachmentNote ??
              'No attachment required for this leave request.'}
          </p>
        )}
      </article>

      <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="shrink-0 border-b border-border px-5 py-3">
          <h2 className="text-h2 text-text-black">Approvers</h2>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-border text-small text-text-gray">
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Approver</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Action Date</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wide">Remarks</th>
                <th className="px-5 py-3 text-center font-bold uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {detail.approvers.map((approver) => {
                const isYou = approver.id === user.id
                const canRemind = canSendApproverReminder(detail, approver)
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
                      {approver.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1.5 text-status-approved">
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                          Approved
                        </span>
                      ) : approver.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1.5 text-status-rejected">
                          <XCircle className="size-4" aria-hidden="true" />
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-text-gray">
                          <Circle className="size-4" aria-hidden="true" />
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
                    <td className="px-5 py-3.5 text-center">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!canRemind}
                        onClick={() => setReminderTarget(approver)}
                      >
                        Send Reminder
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </article>

      <ConfirmReasonModal
        open={reminderTarget !== null}
        onClose={() => setReminderTarget(null)}
        onConfirm={() => handleReminderConfirm()}
        requireReason={false}
        title="Send Reminder"
        description={
          reminderTarget
            ? `Send a reminder to ${reminderTarget.name} that this leave request still needs their action?`
            : 'Send a reminder to this approver?'
        }
        confirmLabel="Send Reminder"
        cancelLabel="Cancel"
        confirmVariant="primary"
      />

      <SuccessDialog
        open={reminderSuccessOpen}
        onClose={() => setReminderSuccessOpen(false)}
        title="Reminder sent"
        message="The reminder email has been queued for the selected approver."
      />

      <AttachmentPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fileName={previewFileName}
      />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-small text-text-gray">{label}</dt>
      <dd className="text-body font-semibold text-text-black sm:text-right">{value}</dd>
    </div>
  )
}
