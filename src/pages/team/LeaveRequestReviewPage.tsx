import { useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import { approveLeave, rejectLeave } from '../../api/approvals'
import { ApiError } from '../../api/axios-client'
import { useAuth } from '../../auth/AuthContext'
import { AttachmentPreviewModal } from '../../components/ui/AttachmentPreviewModal'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { DetailPageSkeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import { useLeaveDetail } from '../../hooks/api/useLeaveDetail'
import { isApprovalsListKey, swrKeys } from '../../hooks/api/swrKeys'
import {
  approvalRequirementLabel,
  eligibleApproverPurpose,
  formatDateTime,
  formatDurationDays,
  formatLeavePeriod,
  getApprovalProgressLabel,
  getApprovalProgressPercent,
  mapApiLeaveStatusToUi,
} from '../../utils/leaveDisplay'
import {
  listPathWithTab,
  listTabFromLocationState,
} from '../../utils/listTab'

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
  const approvalsRequired = requirements.length
  const approvalsCompleted = useMemo(
    () => requirements.filter((req) => req.is_satisfied).length,
    [requirements],
  )

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

  const approverRows = useMemo(
    () =>
      eligibleApprovers.map((approver) => {
        let status: 'approved' | 'rejected' | 'no_action' = 'no_action'
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

  const isRejected = detail?.status === 'rejected'
  const progressPercent = getApprovalProgressPercent(
    approvalsCompleted,
    approvalsRequired,
  )
  const progressLabel = isRejected
    ? 'Rejected'
    : getApprovalProgressLabel(approvalsCompleted, approvalsRequired)

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
    return <DetailPageSkeleton />
  }

  if (notFound || !detail || !uiStatus) {
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
      <Link
        to={backToApprovals}
        className="text-body inline-flex w-fit shrink-0 items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Leave Approvals
      </Link>

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
          <dl className="mt-3 space-y-2.5">
            <InfoRow label="Employee No." value={employeeNumber} />
            <InfoRow label="Employee Name" value={employeeName} />
            <InfoRow label="Department" value={departmentLabel} />
            <InfoRow label="Group" value={groupLabel} />
          </dl>
        </article>

        <article className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-h2 text-text-black">Leave Request Summary</h2>
          <dl className="mt-3 space-y-2.5">
            <InfoRow
              label="Date Filed"
              value={formatDateTime(detail.created_at)}
            />
            <InfoRow
              label="Leave Period"
              value={formatLeavePeriod(detail.start_date, detail.end_date)}
            />
            <InfoRow
              label="Duration"
              value={formatDurationDays(detail.duration)}
            />
            <InfoRow label="Reason" value={detail.leave_reason} />
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
            {requirements.map((requirement) => {
              const completed = requirement.is_satisfied
              const label = approvalRequirementLabel(requirement)
              return (
                <li
                  key={requirement.display_order}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-2 text-body text-text-black">
                    {isRejected ? (
                      <XCircle
                        className="size-4 shrink-0 fill-status-rejected text-white"
                        aria-hidden="true"
                      />
                    ) : completed ? (
                      <CheckCircle2
                        className="size-4 shrink-0 fill-status-approved text-white"
                        aria-hidden="true"
                      />
                    ) : (
                      <Clock3
                        className="size-4 shrink-0 fill-status-pending-conversion text-white"
                        aria-hidden="true"
                      />
                    )}
                    {label}
                  </span>
                  <span
                    className={`text-small font-semibold ${
                      isRejected
                        ? 'text-status-rejected'
                        : completed
                          ? 'text-status-approved'
                          : 'text-status-pending-conversion'
                    }`}
                  >
                    {isRejected ? 'Rejected' : completed ? 'Completed' : 'Pending'}
                  </span>
                </li>
              )
            })}
          </ul>
        </article>
      </section>

      <article className="shrink-0 rounded-lg border border-border bg-surface px-4 py-3">
        <h2 className="text-h2 text-text-black">Attachments</h2>
        {detail.has_attachment ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-body font-semibold text-text-black">
              Leave attachment
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                openPreview('Leave attachment', detail.attachment_url)
              }
            >
              View
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-body text-text-gray italic">
            No attachment required for this leave request.
          </p>
        )}
      </article>

      <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="shrink-0 border-b border-border px-5 py-3">
          <h2 className="text-h2 text-text-black">Approvers</h2>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="sticky top-0 z-10 bg-surface-muted">
              <tr className="border-b border-border text-small text-text-gray">
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
              {approverRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-6 text-center text-body text-text-gray"
                  >
                    No eligible approvers for this stage.
                  </td>
                </tr>
              ) : (
                approverRows.map((approver) => {
                  const isYou = approver.id === user.id
                  return (
                    <tr
                      key={`${approver.id}-${approver.purpose}`}
                      className="border-b border-border/60 text-body text-text-black last:border-b-0"
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
                      <td className="px-5 py-3.5 text-text-gray">
                        {approver.purpose}
                      </td>
                      <td className="px-5 py-3.5">
                        <ApproverStatusCell status={approver.status} />
                      </td>
                      <td className="px-5 py-3.5 text-text-gray">
                        {approver.actionDate ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-text-gray">
                        {approver.remarks ?? '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </article>

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

function ApproverStatusCell({
  status,
}: {
  status: 'approved' | 'rejected' | 'no_action'
}): ReactNode {
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
  return (
    <span className="inline-flex items-center gap-1.5 text-text-gray">
      <Circle className="size-3.5" aria-hidden="true" />
      No Action Yet
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-body text-text-gray">{label}</dt>
      <dd className="text-body font-semibold text-text-black sm:text-right">
        {value}
      </dd>
    </div>
  )
}
