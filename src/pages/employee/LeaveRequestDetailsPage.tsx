import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  Pencil,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react'
import { ApiError } from '../../api/axios-client'
import { AttachmentPreviewModal } from '../../components/ui/AttachmentPreviewModal'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { DetailPageSkeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SuccessDialog } from '../../components/ui/SuccessDialog'
import { useLeaveDetail } from '../../hooks/api/useLeaveDetail'
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

export function LeaveRequestDetailsPage() {
  const { leaveRequestId } = useParams<{ leaveRequestId: string }>()
  const navigate = useNavigate()
  const leaveId = Number(leaveRequestId)
  const validId = Number.isInteger(leaveId) && leaveId > 0

  const { data: detail, error, isLoading } = useLeaveDetail(
    validId ? leaveId : null,
  )

  const [cancelOpen, setCancelOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
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

  /** Match acted history by emp_id for Status / Date / Remarks columns. */
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

  /**
   * Approvers table: eligible pool for the current stage.
   * Leave stages join `approval_requirements[].history`;
   * conversion stages join nested `conversion` review fields.
   */
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

  const isConversion =
    detail?.status === 'pending_conversion' && detail.conversion != null
  const canEdit =
    detail?.status === 'pending_approval' &&
    detail.leave_type.code.toUpperCase() === 'VL' &&
    !detail.approval_requirements.some((req) => req.history != null)
  const canCancel =
    detail?.status === 'pending_approval' ||
    detail?.status === 'pending_conversion'
  const canConvertToSick =
    detail?.status === 'confirmed' &&
    detail.leave_type.code.toUpperCase() === 'VL' &&
    detail.conversion == null

  const isRejected = detail?.status === 'rejected'
  const progressPercent = getApprovalProgressPercent(
    approvalsCompleted,
    approvalsRequired,
  )
  const progressLabel = isRejected
    ? 'Rejected'
    : getApprovalProgressLabel(approvalsCompleted, approvalsRequired)

  const notFound =
    !validId ||
    (error instanceof ApiError && error.status === 404) ||
    (!isLoading && !detail && error != null)

  function openPreview(fileName: string, url: string | null) {
    setPreviewFileName(fileName)
    setPreviewUrl(url)
    setPreviewOpen(true)
  }

  function handleCancelConfirm(_reason: string) {
    // TODO(REPLACE): Phase 2.6 — POST /leaves/{id}/cancel
    void _reason
    setCancelOpen(false)
    setSuccessOpen(true)
  }

  function handleSuccessClose() {
    setSuccessOpen(false)
    navigate('/dashboard')
  }

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (notFound || !detail || !uiStatus) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <Link
          to="/dashboard"
          className="text-body inline-flex w-fit items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Dashboard
        </Link>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h1 className="text-h1 text-text-black">Leave request not found</h1>
          <p className="text-body text-text-gray mt-2">
            No leave request was found for ID{' '}
            <span className="font-semibold text-text-black">
              {leaveRequestId ?? 'unknown'}
            </span>
            . Open a request from your dashboard list.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <Link
        to="/dashboard"
        className="text-body inline-flex w-fit shrink-0 items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Dashboard
      </Link>

      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h1 text-text-black">{detail.leave_type.name}</h1>
          <StatusBadge status={uiStatus} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canConvertToSick ? (
            <Link
              to={`/my-leave/requests/${detail.id}/convert`}
              className="inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-3 py-2 text-body font-medium text-white transition-opacity hover:opacity-90"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Convert to Sick Leave
            </Link>
          ) : canEdit ? (
            <Link
              to={`/my-leave/requests/${detail.id}/edit`}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-body font-medium text-text-black transition-colors hover:bg-surface-muted"
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit Request
            </Link>
          ) : (
            <Button
              type="button"
              disabled
              title={
                isConversion
                  ? 'Editing is not available during leave conversion'
                  : 'Editing is disabled after an approver has taken action'
              }
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit Request
            </Button>
          )}

          <Button
            type="button"
            disabled={!canCancel}
            onClick={() => setCancelOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Cancel Request
          </Button>
        </div>
      </div>

      {isConversion && conversion ? (
        <section className="grid shrink-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
          <article className="flex flex-col justify-center rounded-lg border border-border bg-surface p-5">
            <h2 className="text-h2 text-text-black">Original Leave Request</h2>
            <dl className="mt-4 space-y-3">
              <InfoRow
                label="Leave Type"
                value={conversion.from_leave_type.name}
              />
              <InfoRow
                label="Date Filed"
                value={formatDateTime(detail.created_at)}
              />
              <InfoRow
                label="Actual Leave Period"
                value={formatLeavePeriod(detail.start_date, detail.end_date)}
              />
              <InfoRow
                label="Filed By"
                value={
                  detail.filed_by_emp_id === detail.emp_id
                    ? 'Self'
                    : `Employee #${detail.filed_by_emp_id}`
                }
              />
              <InfoRow label="Reason" value={detail.leave_reason} />
              <InfoRow
                label="Attachment"
                value={
                  detail.has_attachment
                    ? 'Attached'
                    : 'No attachment'
                }
              />
            </dl>
          </article>

          <article className="flex flex-col justify-center rounded-lg border border-border bg-surface p-5">
            <h2 className="text-h2 text-text-black">Leave Conversion Request</h2>
            <dl className="mt-4 space-y-3">
              <InfoRow
                label="Requested Leave Type"
                value={conversion.to_leave_type.name}
              />
              <InfoRow
                label="Date of Conversion Request"
                value={formatDateTime(conversion.created_at)}
              />
              <InfoRow
                label="Remarks"
                value={conversion.remarks?.trim() || '—'}
              />
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <dt className="text-body text-text-gray">Medical certificate</dt>
                <dd className="flex items-center gap-2 sm:justify-end">
                  <span className="text-body font-semibold text-text-black">
                    {conversion.has_med_cert ? 'Uploaded' : '—'}
                  </span>
                  {conversion.has_med_cert && conversion.med_cert_url ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        openPreview(
                          'Medical certificate',
                          conversion.med_cert_url,
                        )
                      }
                    >
                      View
                    </Button>
                  ) : null}
                </dd>
              </div>
            </dl>
          </article>
        </section>
      ) : (
        <section className="grid shrink-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-h2 text-text-black">Leave Information</h2>
            <dl className="mt-4 space-y-3">
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

          <article className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-h2 text-text-black">Approval Progress</h2>
            <p className="text-small text-text-gray mt-2">{progressLabel}</p>

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

            <ul className="mt-4 space-y-3">
              {requirements.length === 0 ? (
                <li className="text-body text-text-gray">
                  No approval steps on this request.
                </li>
              ) : (
                requirements.map((requirement) => {
                  const completed = requirement.is_satisfied
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
                        {approvalRequirementLabel(requirement)}
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
                        {isRejected
                          ? 'Rejected'
                          : completed
                            ? 'Completed'
                            : 'Pending'}
                      </span>
                    </li>
                  )
                })
              )}
            </ul>
          </article>
        </section>
      )}

      {!isConversion && (
        <article className="shrink-0 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-h2 text-text-black">Attachments</h2>
          {detail.has_attachment && detail.attachment_url ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-body font-semibold text-text-black">
                Attachment
              </span>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  openPreview('Attachment', detail.attachment_url)
                }
              >
                View
              </Button>
            </div>
          ) : (
            <p className="text-body text-text-gray mt-3 italic">
              No attachment required for this leave request.
            </p>
          )}
        </article>
      )}

      <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="shrink-0 border-b border-border px-5 py-4">
          <h2 className="text-h2 text-text-black">Approvers</h2>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-surface-muted text-small text-text-gray">
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
                    No eligible approvers for this request.
                  </td>
                </tr>
              ) : (
                approverRows.map((approver) => (
                  <tr
                    key={`${approver.id}-${approver.purpose}`}
                    className="border-b border-border/60 text-body text-text-black last:border-b-0"
                  >
                    <td className="px-5 py-3.5">{approver.name}</td>
                    <td className="px-5 py-3.5 text-text-gray">
                      {approver.purpose ??
                        (approver.role === 'admin'
                          ? 'Admin validation'
                          : 'Leave approval')}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      <ConfirmReasonModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel leave request"
        description="This will cancel the leave request. Please provide a cancellation reason."
        reasonLabel="Cancellation reason"
        reasonPlaceholder="Why are you cancelling this request?"
        confirmLabel="Cancel request"
        cancelLabel="Keep request"
        confirmVariant="danger"
      />

      <SuccessDialog
        open={successOpen}
        onClose={handleSuccessClose}
        title="Request cancelled"
        message="Your leave request has been cancelled successfully."
        confirmLabel="Back to dashboard"
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-body text-text-gray">{label}</dt>
      <dd className="text-body font-semibold text-text-black sm:text-right">
        {value}
      </dd>
    </div>
  )
}
