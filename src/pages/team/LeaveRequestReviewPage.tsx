import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { TriangleAlert } from 'lucide-react'
import { approveLeave, rejectLeave } from '../../api/approvals'
import { ApiError } from '../../api/axios-client'
import { useAuth } from '../../auth/AuthContext'
import { ApprovalDetailsTable } from '../../components/leave/ApprovalDetailsTable'
import { LeaveAttachmentRow } from '../../components/leave/LeaveAttachmentRow'
import { LeaveInfoRow } from '../../components/leave/LeaveInfoRow'
import { AttachmentPreviewModal } from '../../components/ui/AttachmentPreviewModal'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { PageBackLink } from '../../components/ui/PageBackLink'
import { LeaveDetailLoadingView } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import { INFO_FIELD_GRID_CLASS } from '../../components/ui/tableStyles'
import { useLeaveDetail } from '../../hooks/api/useLeaveDetail'
import { isApprovalsListKey, swrKeys } from '../../hooks/api/swrKeys'
import type { ApproverRow } from '../../mocks/leaveRequests'
import {
  eligibleApproverPurpose,
  formatDateTime,
  formatDurationDays,
  formatLeavePeriod,
  mapApiLeaveStatusToUi,
} from '../../utils/leaveDisplay'
import {
  listPathWithTab,
  listTabFromLocationState,
} from '../../utils/listTab'

const ATTACHMENT_LABEL = 'Leave attachment'

function messageFromApiError(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof ApiError) {
    const body = error.body
    if (body && typeof body === 'object' && 'errors' in body) {
      const errors = (body as { errors: Record<string, string[]> }).errors
      const first = Object.values(errors).flat()[0]
      if (typeof first === 'string' && first.length > 0) return first
    }
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message: unknown }).message
      if (typeof message === 'string' && message.trim()) return message
    }
    if (error.message) return error.message
  }
  return fallback
}

function orgLabel(
  org: { abbreviation: string | null; name: string | null } | null | undefined,
): string {
  if (!org) return '—'
  return org.abbreviation?.trim() || org.name?.trim() || '—'
}

export function LeaveRequestReviewPage() {
  const { leaveRequestId } = useParams<{ leaveRequestId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { mutate } = useSWRConfig()

  const leaveId = Number(leaveRequestId)
  const validId = Number.isInteger(leaveId) && leaveId > 0

  const { data: detail, error, isLoading } = useLeaveDetail(
    validId ? leaveId : null,
  )

  const listTab = listTabFromLocationState(
    location.state,
    location.pathname.includes('/leave-requests/') ? 'all' : 'pending',
  )
  const backToApprovals = listPathWithTab('/team/leave-approvals', listTab)
  const routeWantsReview = location.pathname.includes('/leave-approvals/')

  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [successKind, setSuccessKind] = useState<'approve' | 'reject'>(
    'approve',
  )
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFileName, setPreviewFileName] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const uiStatus = detail ? mapApiLeaveStatusToUi(detail.status) : null

  const requirements = detail?.approval_requirements ?? []
  const eligibleApprovers = detail?.eligible_approvers ?? []

  const historyByEmpId = useMemo(() => {
    const map = new Map<
      number,
      NonNullable<(typeof requirements)[number]['history']>
    >()
    for (const requirement of requirements) {
      const history = requirement.history
      if (history) map.set(history.approver_emp_id, history)
    }
    return map
  }, [requirements])

  const leaveStatus = detail?.status
  const conversion = detail?.conversion ?? null
  const usesConversionReview =
    leaveStatus === 'pending_conversion' || leaveStatus === 'converted_to_sl'

  const approverRows: ApproverRow[] = useMemo(
    () =>
      eligibleApprovers.map((approver) => {
        let status: ApproverRow['status'] = 'no_action'
        let actionDate: string | null = null
        let remarks: string | null = null

        if (usesConversionReview && conversion) {
          const reviewedBy = conversion.reviewed_by_emp_id
          if (
            reviewedBy != null &&
            Number(reviewedBy) === Number(approver.emp_id)
          ) {
            if (conversion.status === 'approved') status = 'approved'
            else if (conversion.status === 'rejected') status = 'rejected'

            actionDate = conversion.reviewed_at
              ? formatDateTime(conversion.reviewed_at)
              : null
            remarks = conversion.remarks?.trim() || null
          }
        } else {
          const history = historyByEmpId.get(approver.emp_id)
          if (history?.is_approved === true) status = 'approved'
          else if (history?.is_approved === false) status = 'rejected'

          actionDate = history?.created_at
            ? formatDateTime(history.created_at)
            : null
          remarks = history?.remarks?.trim() || null
        }

        return {
          id: String(approver.emp_id),
          name: approver.name.trim() || `Employee #${approver.emp_id}`,
          purpose: eligibleApproverPurpose(
            approver.purpose,
            approver.approver_type,
          ),
          role:
            approver.approver_type === 'admin'
              ? ('admin' as const)
              : ('approver' as const),
          status,
          actionDate,
          remarks,
        }
      }),
    [
      conversion,
      eligibleApprovers,
      historyByEmpId,
      usesConversionReview,
    ],
  )

  const canAct = useMemo(() => {
    if (!detail) return false
    if (detail.status !== 'pending_approval') return false
    return eligibleApprovers.some(
      (approver) => String(approver.emp_id) === String(user.id),
    )
  }, [detail, eligibleApprovers, user.id])

  const isReviewMode = routeWantsReview && canAct

  const decisionSettled =
    detail?.status === 'confirmed' ||
    detail?.status === 'rejected' ||
    detail?.status === 'cancelled' ||
    detail?.status === 'converted_to_sl'

  const employee = detail?.employee ?? null
  const employeeNumber = employee?.employee_number ?? '—'
  const employeeName = employee?.name?.trim() || '—'
  const departmentLabel = orgLabel(employee?.department)
  const groupLabel = orgLabel(employee?.group)

  const notFound =
    !validId ||
    (error instanceof ApiError &&
      (error.status === 404 || error.status === 403)) ||
    (!isLoading && !detail && error != null)

  function openPreview(fileName: string, url: string | null) {
    setPreviewFileName(fileName)
    setPreviewUrl(url)
    setPreviewOpen(true)
  }

  async function revalidateApprovalsCaches(updatedId: number, updated: unknown) {
    await Promise.all([
      mutate(swrKeys.leave(updatedId), updated, { revalidate: false }),
      mutate(swrKeys.pendingApprovals),
      mutate(isApprovalsListKey, undefined, { revalidate: true }),
    ])
  }

  async function handleRejectConfirm(reason: string) {
    if (!detail) return

    setRejectOpen(false)
    setSubmitting(true)
    setActionError(null)

    try {
      const updated = await rejectLeave(detail.id, {
        remarks: reason.trim(),
      })
      await revalidateApprovalsCaches(detail.id, updated)
      setSuccessKind('reject')
      setSuccessOpen(true)
    } catch (err) {
      setActionError(
        messageFromApiError(err, 'Unable to reject leave request. Please try again.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleApproveConfirm() {
    if (!detail) return

    setApproveOpen(false)
    setSubmitting(true)
    setActionError(null)

    try {
      const updated = await approveLeave(detail.id)
      await revalidateApprovalsCaches(detail.id, updated)
      setSuccessKind('approve')
      setSuccessOpen(true)
    } catch (err) {
      setActionError(
        messageFromApiError(err, 'Unable to approve leave request. Please try again.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  function handleSuccessClose() {
    setSuccessOpen(false)
    navigate(backToApprovals)
  }

  if (isLoading) {
    return (
      <LeaveDetailLoadingView
        backTo={backToApprovals}
        backLabel="Back to Leave Approvals"
      />
    )
  }

  if (notFound || !detail || !uiStatus) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <PageBackLink to={backToApprovals}>Back to Leave Approvals</PageBackLink>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h1 className="text-h1 text-text-black">Leave request not found</h1>
          <p className="mt-2 text-body text-text-gray">
            No leave request was found for ID{' '}
            <span className="font-semibold text-text-black">
              {leaveRequestId ?? 'unknown'}
            </span>
            , or you are not allowed to view it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <PageBackLink to={backToApprovals}>Back to Leave Approvals</PageBackLink>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <h1 className="text-h1 text-text-black">{detail.leave_type.name}</h1>
        <StatusBadge status={uiStatus} />
      </div>

      {actionError ? (
        <div
          className="flex shrink-0 gap-2 rounded-md border-2 border-status-rejected bg-status-rejected/10 px-3 py-2.5"
          role="alert"
        >
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-status-rejected"
            aria-hidden="true"
          />
          <p className="text-small font-semibold text-status-rejected">
            {actionError}
          </p>
        </div>
      ) : null}

      <section className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-3">
        <article className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-h2 text-text-black">Employee Information</h2>
          <dl className={`mt-3 ${INFO_FIELD_GRID_CLASS}`}>
            <LeaveInfoRow label="Employee No." value={employeeNumber} />
            <LeaveInfoRow label="Employee Name" value={employeeName} />
            <LeaveInfoRow label="Department" value={departmentLabel} />
            <LeaveInfoRow label="Group" value={groupLabel} />
          </dl>
        </article>

        <article className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-h2 text-text-black">Leave Request Summary</h2>
          <dl className={`mt-3 ${INFO_FIELD_GRID_CLASS}`}>
            <LeaveInfoRow
              label="Date Filed"
              value={formatDateTime(detail.created_at)}
            />
            <LeaveInfoRow
              label="Leave Period"
              value={formatLeavePeriod(detail.start_date, detail.end_date)}
            />
            <LeaveInfoRow
              label="Duration"
              value={formatDurationDays(detail.duration)}
            />
            <LeaveInfoRow label="Reason" value={detail.leave_reason} />
            {detail.has_attachment ? (
              <LeaveAttachmentRow
                value={ATTACHMENT_LABEL}
                onView={() =>
                  openPreview(ATTACHMENT_LABEL, detail.attachment_url)
                }
              />
            ) : (
              <LeaveInfoRow label="Attachment" value="None required" />
            )}
          </dl>
        </article>
      </section>

      <ApprovalDetailsTable
        approvers={approverRows}
        decisionSettled={Boolean(decisionSettled)}
        showPurpose
        currentUserId={String(user.id)}
        youBadgeVariant="primary"
      />

      {isReviewMode ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            disabled={submitting}
            onClick={() => {
              setActionError(null)
              setRejectOpen(true)
            }}
          >
            Reject
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={submitting}
            onClick={() => {
              setActionError(null)
              setApproveOpen(true)
            }}
          >
            {submitting ? 'Submitting…' : 'Approve'}
          </Button>
        </div>
      ) : null}

      <ConfirmReasonModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={(reason) => {
          void handleRejectConfirm(reason)
        }}
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
        onConfirm={() => {
          void handleApproveConfirm()
        }}
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
        fileName={previewFileName}
        previewUrl={previewUrl}
      />
    </div>
  )
}
