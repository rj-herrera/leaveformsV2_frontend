import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ApprovalDetailsTable } from '../../components/leave/ApprovalDetailsTable'
import { LeaveAttachmentRow } from '../../components/leave/LeaveAttachmentRow'
import { LeaveConversionPanels } from '../../components/leave/LeaveConversionPanels'
import { LeaveDecisionBar } from '../../components/leave/LeaveDecisionBar'
import { LeaveInfoRow } from '../../components/leave/LeaveInfoRow'
import { AttachmentPreviewModal } from '../../components/ui/AttachmentPreviewModal'
import { PageBackLink } from '../../components/ui/PageBackLink'
import { LeaveDetailLoadingView } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { INFO_FIELD_GRID_CLASS } from '../../components/ui/tableStyles'
import { shouldShowDataSkeleton } from '../../mocks/config'
import { getLeaveRequestDetail } from '../../mocks/leaveRequests'
import {
  attachmentFilesFromNames,
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

  const conversion = detail.conversion
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
      <PageBackLink to={backToList}>Back to Leave Requests</PageBackLink>

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
        <LeaveConversionPanels
          conversion={conversion}
          onPreview={openPreview}
          spacing="compact"
        />
      ) : (
        <article className="shrink-0 rounded-lg border border-border bg-surface p-4">
          <h2 className="text-h2 text-text-black">Leave Request Summary</h2>
          <dl className={`mt-3 ${INFO_FIELD_GRID_CLASS}`}>
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
        currentUserId={user.id}
        youBadgeVariant="muted"
      />

      <LeaveDecisionBar
        visible={canAct}
        onReject={(reason) => {
          // TODO(REPLACE): POST admin reject conversion
          void reason
        }}
        onApprove={() => {
          // TODO(REPLACE): POST admin approve conversion
        }}
        onSuccessClose={() => navigate(backToList)}
        reject={{
          title: 'Reject leave conversion',
          description:
            'Please provide a reason for rejecting this conversion request.',
          confirmLabel: 'Reject',
        }}
        approve={{
          title: 'Approve leave conversion',
          description:
            'Are you sure you want to approve this leave conversion request?',
          confirmLabel: 'Approve',
        }}
        success={{
          approveTitle: 'Approved',
          rejectTitle: 'Rejected',
          approveMessage: 'Leave conversion request successfully approved.',
          rejectMessage: 'Leave conversion request has been rejected.',
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
