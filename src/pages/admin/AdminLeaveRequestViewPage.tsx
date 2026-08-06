import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
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
import { shouldShowDataSkeleton } from '../../mocks/config'
import {
  canSendApproverReminder,
  getLeaveRequestDetail,
  type ApproverRow,
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
  const [previewFiles, setPreviewFiles] = useState<AttachmentFile[]>([])
  const [reminderTarget, setReminderTarget] = useState<ApproverRow | null>(
    null,
  )
  const [reminderSuccessOpen, setReminderSuccessOpen] = useState(false)

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

  const decisionSettled =
    detail.status === 'APPROVED' || detail.status === 'REJECTED'

  function openPreview(attachmentValue: string | null | undefined) {
    const files = attachmentFilesFromNames(attachmentValue)
    if (files.length === 0) return
    setPreviewFiles(files)
    setPreviewOpen(true)
  }

  function handleReminderConfirm() {
    // TODO(REPLACE): POST reminder email to reminderTarget
    setReminderTarget(null)
    setReminderSuccessOpen(true)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto">
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

      <section className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-2">
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

      <article className="shrink-0 rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-h2 text-text-black">Approval Details</h2>
        </div>
        <div className="max-h-[min(22rem,45vh)] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="sticky top-0 z-10">
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
                <th className="px-5 py-3 text-center font-bold uppercase tracking-wide">
                  Action
                </th>
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
                            className="size-4 fill-text-gray text-text-gray"
                            aria-hidden="true"
                          />
                          No action required
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
        files={previewFiles}
      />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-small text-text-gray">{label}</dt>
      <dd className="text-body font-semibold text-text-black sm:text-right">
        {value}
      </dd>
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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="text-small text-text-gray">Attachment</dt>
      <dd className="sm:text-right">
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
