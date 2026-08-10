import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ApprovalDetailsTable } from '../../components/leave/ApprovalDetailsTable'
import { LeaveDecisionBar } from '../../components/leave/LeaveDecisionBar'
import { LeaveEmployeeSummaryPanels } from '../../components/leave/LeaveEmployeeSummaryPanels'
import { AttachmentPreviewModal } from '../../components/ui/AttachmentPreviewModal'
import { PageBackLink } from '../../components/ui/PageBackLink'
import { LeaveDetailLoadingView } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { shouldShowDataSkeleton } from '../../mocks/config'
import {
  getLeaveRequestDetail,
  isApproverActionable,
} from '../../mocks/leaveRequests'
import {
  attachmentFilesFromNames,
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
        <PageBackLink to={backToApprovals}>Back to Leave Approvals</PageBackLink>
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

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <PageBackLink to={backToApprovals}>Back to Leave Approvals</PageBackLink>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <h1 className="text-h1 text-text-black">{detail.leaveType}</h1>
        <StatusBadge status={detail.status} />
      </div>

      <LeaveEmployeeSummaryPanels detail={detail} onPreview={openPreview} />

      <ApprovalDetailsTable
        approvers={detail.approvers}
        decisionSettled={decisionSettled}
        currentUserId={user.id}
        youBadgeVariant="primary"
      />

      <LeaveDecisionBar
        visible={isReviewMode}
        onReject={(reason) => {
          // TODO(REPLACE): POST reject with reason to API
          void reason
        }}
        onApprove={() => {
          // TODO(REPLACE): POST approve to API
        }}
        onSuccessClose={() => navigate(backToApprovals)}
        reject={{
          title: 'Reject leave request',
          description:
            'Please provide a reason for rejecting this leave request.',
          reasonLabel: 'Rejection reason',
          reasonPlaceholder: 'Why are you rejecting this request?',
          confirmLabel: 'Reject request',
          cancelLabel: 'Go back',
        }}
        approve={{
          title: 'Approve leave request',
          description: 'Are you sure you want to approve this leave request?',
          confirmLabel: 'Approve request',
          cancelLabel: 'Go back',
        }}
        success={{
          approveTitle: 'Request approved',
          rejectTitle: 'Request rejected',
          approveMessage: 'The leave request has been approved successfully.',
          rejectMessage: 'The leave request has been rejected successfully.',
          confirmLabel: 'Back to Leave Approvals',
        }}
      />

      <AttachmentPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        files={previewFiles}
      />
    </div>
  )
}
