import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import {
  Pencil,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { ApiError } from '../../api/axios-client'
import { cancelLeave } from '../../api/leaves'
import { useAuth } from '../../auth/AuthContext'
import { ApprovalDetailsTable } from '../../components/leave/ApprovalDetailsTable'
import { LeaveAttachmentRow } from '../../components/leave/LeaveAttachmentRow'
import { LeaveConversionPanels } from '../../components/leave/LeaveConversionPanels'
import { LeaveInfoRow } from '../../components/leave/LeaveInfoRow'
import {
  RequestConversionModal,
  type ConversionLeaveType,
} from '../../components/leave/RequestConversionModal'
import { AttachmentPreviewModal } from '../../components/ui/AttachmentPreviewModal'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { PageBackLink } from '../../components/ui/PageBackLink'
import { LeaveDetailLoadingView } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/ToastProvider'
import { INFO_FIELD_GRID_CLASS } from '../../components/ui/tableStyles'
import { useLeaveDetail } from '../../hooks/api/useLeaveDetail'
import { isLeaveListKey, swrKeys } from '../../hooks/api/swrKeys'
import type { ApproverRow } from '../../types/approverRow'
import type { LeaveConversionInfo } from '../../types/leaveConversionInfo'
import { formatDayTypeLabel } from '../../utils/leaveDates'
import {
  formatDateTime,
  formatDurationDays,
  formatLeavePeriod,
  formatShortDate,
  mapApiLeaveStatusToUi,
  resolveConversionReviewerName,
} from '../../utils/leaveDisplay'

const ATTACHMENT_LABEL = 'Attachment'
const MED_CERT_LABEL = 'Medical certificate'

function messageFromApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body
    if (body && typeof body === 'object' && 'errors' in body) {
      const errors = (body as { errors: Record<string, string[]> }).errors
      const first = Object.values(errors).flat()[0]
      if (typeof first === 'string' && first.length > 0) return first
    }
    if (error.message) return error.message
  }
  return 'Unable to cancel leave request. Please try again.'
}

export function LeaveRequestDetailsPage() {
  const { leaveRequestId } = useParams<{ leaveRequestId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { mutate } = useSWRConfig()
  const toast = useToast()
  const leaveId = Number(leaveRequestId)
  const validId = Number.isInteger(leaveId) && leaveId > 0

  const { data: detail, error, isLoading } = useLeaveDetail(
    validId ? leaveId : null,
  )

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [conversionModalOpen, setConversionModalOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFileName, setPreviewFileName] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const uiStatus = detail ? mapApiLeaveStatusToUi(detail.status) : null

  const requirements = detail?.approval_requirements ?? []
  const eligibleApprovers = detail?.eligible_approvers ?? []

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

  const isConversion = detail?.conversion != null
  const canEdit =
    detail?.status === 'pending_approval' &&
    detail.leave_type.code.toUpperCase() === 'VL' &&
    !detail.approval_requirements.some((req) => req.history != null)
  const canCancel = detail?.status === 'pending_approval'
  const canRequestConversion =
    detail?.status === 'confirmed' &&
    detail.leave_type.code.toUpperCase() === 'VL' &&
    detail.conversion == null &&
    String(detail.emp_id) === String(user.id)

  const decisionSettled =
    detail?.status === 'confirmed' ||
    detail?.status === 'rejected' ||
    detail?.status === 'cancelled' ||
    detail?.status === 'converted_to_sl'

  const conversionPanels: LeaveConversionInfo | null =
    detail && conversion
      ? {
          status: conversion.status,
          originalLeaveType: conversion.from_leave_type.name,
          originalDayType: formatDayTypeLabel(detail.day_type),
          originalDateFiled: formatShortDate(detail.created_at),
          originalLeavePeriod: formatLeavePeriod(
            detail.start_date,
            detail.end_date,
          ),
          filedBy:
            detail.filed_by?.name?.trim() ||
            detail.filed_by?.employee_number ||
            (detail.filed_by_emp_id === detail.emp_id
              ? 'Self'
              : `Employee #${detail.filed_by_emp_id}`),
          originalReason: detail.leave_reason,
          originalAttachment: detail.has_attachment ? ATTACHMENT_LABEL : null,
          requestedLeaveType: conversion.to_leave_type.name,
          conversionRequestDate: formatShortDate(conversion.created_at),
          conversionReason: '—',
          conversionAttachment: conversion.has_med_cert
            ? MED_CERT_LABEL
            : null,
          reviewedBy: resolveConversionReviewerName(
            conversion,
            eligibleApprovers,
          ),
          ...(conversion.status === 'rejected'
            ? {
                reviewedAtLabel: conversion.reviewed_at
                  ? formatDateTime(conversion.reviewed_at)
                  : '—',
                rejectionReason: conversion.remarks?.trim() || '—',
              }
            : {}),
        }
      : null

  const notFound =
    !validId ||
    (error instanceof ApiError && error.status === 404) ||
    (!isLoading && !detail && error != null)

  function openPreview(fileName: string, url: string | null) {
    setPreviewFileName(fileName)
    setPreviewUrl(url)
    setPreviewOpen(true)
  }

  function openPreviewFromAttachmentLabel(value: string | null | undefined) {
    if (!value || !detail) return
    if (value === MED_CERT_LABEL) {
      openPreview(MED_CERT_LABEL, conversion?.med_cert_url ?? null)
      return
    }
    openPreview(ATTACHMENT_LABEL, detail.attachment_url)
  }

  async function handleCancelConfirm(reason: string) {
    if (!detail) return

    setCancelOpen(false)
    setCancelling(true)
    setCancelError(null)

    try {
      const updated = await cancelLeave(detail.id, {
        cancellation_reason: reason.trim(),
      })

      await Promise.all([
        mutate(swrKeys.leave(detail.id), updated, { revalidate: false }),
        mutate(isLeaveListKey, undefined, { revalidate: true }),
        mutate(swrKeys.balances()),
      ])

      toast.success('Leave request cancelled successfully.')
      navigate('/dashboard')
    } catch (err) {
      setCancelError(messageFromApiError(err))
    } finally {
      setCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <LeaveDetailLoadingView
        backTo="/dashboard"
        backLabel="Back to Dashboard"
        infoLayout="employee"
      />
    )
  }

  if (notFound || !detail || !uiStatus) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageBackLink to="/dashboard">Back to Dashboard</PageBackLink>
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
      <PageBackLink to="/dashboard">Back to Dashboard</PageBackLink>

      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h1 text-text-black">{detail.leave_type.name}</h1>
          <StatusBadge status={uiStatus} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canRequestConversion ? (
            <button
              type="button"
              onClick={() => setConversionModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-3 py-2 text-body font-medium text-white transition-opacity hover:opacity-90"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Request Conversion
            </button>
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
            variant="dangerOutline"
            disabled={!canCancel}
            loading={cancelling}
            loadingText="Cancelling…"
            onClick={() => {
              setCancelError(null)
              setCancelOpen(true)
            }}
            title={
              !canCancel
                ? 'Only pending leave requests can be cancelled'
                : undefined
            }
          >
            <Trash2 className="size-4 text-status-rejected" aria-hidden="true" />
            Cancel Request
          </Button>
        </div>
      </div>

      {cancelError ? (
        <div
          className="flex shrink-0 gap-2 rounded-md border-2 border-status-rejected bg-status-rejected/10 px-3 py-2.5"
          role="alert"
        >
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-status-rejected"
            aria-hidden="true"
          />
          <p className="text-small font-semibold text-status-rejected">
            {cancelError}
          </p>
        </div>
      ) : null}

      {conversionPanels ? (
        <LeaveConversionPanels
          conversion={conversionPanels}
          onPreview={openPreviewFromAttachmentLabel}
          spacing="comfortable"
        />
      ) : (
        <section className="grid shrink-0 grid-cols-1 gap-4 lg:grid-cols-1">
          <article className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-h2 text-text-black">Leave Information</h2>
            <dl className={`mt-4 ${INFO_FIELD_GRID_CLASS}`}>
              <LeaveInfoRow
                label="Date Filed"
                value={formatShortDate(detail.created_at)}
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
              <LeaveAttachmentRow
                value={detail.has_attachment ? ATTACHMENT_LABEL : null}
                onView={() =>
                  openPreview(ATTACHMENT_LABEL, detail.attachment_url)
                }
              />
            </dl>
          </article>
        </section>
      )}

      <ApprovalDetailsTable
        approvers={approverRows}
        decisionSettled={Boolean(decisionSettled)}
        headerClassName="shrink-0 border-b border-border px-5 py-4"
      />

      <ConfirmReasonModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={(reason) => {
          void handleCancelConfirm(reason)
        }}
        title="Cancel leave request"
        description="This will cancel the leave request. Please provide a cancellation reason."
        reasonLabel="Cancellation reason"
        reasonPlaceholder="Enter cancellation reason..."
        confirmLabel="Cancel Request"
        cancelLabel="Keep Request"
        confirmVariant="danger"
        iconVariant="cancel"
      />

      <RequestConversionModal
        open={conversionModalOpen}
        onClose={() => setConversionModalOpen(false)}
        onContinue={(type: ConversionLeaveType) => {
          if (type === 'sick') {
            navigate(`/my-leave/requests/${detail.id}/convert`)
            return
          }
          navigate(`/my-leave/requests/${detail.id}/convert/emergency`)
        }}
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
