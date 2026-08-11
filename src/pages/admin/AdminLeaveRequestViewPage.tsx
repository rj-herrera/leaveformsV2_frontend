import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ApprovalDetailsTable } from '../../components/leave/ApprovalDetailsTable'
import { LeaveEmployeeSummaryPanels } from '../../components/leave/LeaveEmployeeSummaryPanels'
import { AttachmentPreviewModal } from '../../components/ui/AttachmentPreviewModal'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { PageBackLink } from '../../components/ui/PageBackLink'
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
        infoLayout="admin-view"
      />
    )
  }

  if (!detail) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <PageBackLink to={backToList}>Back to Leave Requests</PageBackLink>
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
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <PageBackLink to={backToList}>Back to Leave Requests</PageBackLink>

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

      <LeaveEmployeeSummaryPanels
        detail={detail}
        onPreview={openPreview}
        showFiledBy
      />

      <ApprovalDetailsTable
        approvers={detail.approvers}
        decisionSettled={decisionSettled}
        currentUserId={user.id}
        youBadgeVariant="muted"
        canRemind={(approver) => canSendApproverReminder(detail, approver)}
        onRemind={setReminderTarget}
      />

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

