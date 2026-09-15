import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { Check, TriangleAlert, X } from 'lucide-react'
import { ApiError } from '../../api/axios-client'
import { approveLeave, rejectLeave } from '../../api/approvals'
import {
  approveConversion,
  rejectConversion,
} from '../../api/conversions'
import { useAuth } from '../../auth/AuthContext'
import { ApprovalDetailsTable } from '../../components/leave/ApprovalDetailsTable'
import { LeaveAttachmentRow } from '../../components/leave/LeaveAttachmentRow'
import { LeaveConversionPanels } from '../../components/leave/LeaveConversionPanels'
import { LeaveInfoRow, SpecialLeaveDetailRows } from '../../components/leave/LeaveInfoRow'
import { AttachmentPreviewModal } from '../../components/ui/AttachmentPreviewModal'
import { Button } from '../../components/ui/Button'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { PageBackLink } from '../../components/ui/PageBackLink'
import { LeaveDetailLoadingView } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/ToastProvider'
import { INFO_FIELD_GRID_CLASS } from '../../components/ui/tableStyles'
import {
  TOAST_LEAVE_CONVERSION_APPROVED,
  TOAST_LEAVE_CONVERSION_REJECTED,
  TOAST_LEAVE_REQUEST_APPROVED,
  TOAST_LEAVE_REQUEST_REJECTED,
} from '../../constants/toastMessages'
import { useLeaveDetail } from '../../hooks/api/useLeaveDetail'
import { isAdminLeavesListKey, swrKeys } from '../../hooks/api/swrKeys'
import type { LeaveConversionInfo } from '../../types/leaveConversionInfo'
import type { ApproverRow } from '../../types/approverRow'
import {
  previewFilesFromStored,
  type AttachmentFile,
} from '../../utils/attachments'
import { formatDayTypeLabel } from '../../utils/leaveDates'
import {
  isAdminApproved,
  isSpecialLeave,
  requiresAttachment,
} from '../../utils/leaveFiling'
import {
  formatDateTime,
  formatDurationDays,
  formatLeavePeriod,
  formatShortDate,
  isConversionReviewStatus,
  isLeaveDecisionSettled,
  mapApiLeaveStatusToUi,
  resolveConversionReviewerName,
} from '../../utils/leaveDisplay'
import {
  listPathWithTab,
  listTabFromLocationState,
} from '../../utils/listTab'

function messageFromApiError(error: unknown, fallback: string): string {
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

function filedByLabel(detail: {
  emp_id: number
  filed_by_emp_id: number
  filed_by: { name: string | null; employee_number: string } | null
}): string {
  const name = detail.filed_by?.name?.trim()
  if (name) return name
  if (detail.filed_by?.employee_number) return detail.filed_by.employee_number
  return `Employee #${detail.filed_by_emp_id}`
}

export function AdminLeaveValidatePage() {
  const { leaveRequestId } = useParams<{ leaveRequestId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { mutate } = useSWRConfig()
  const toast = useToast()

  const leaveId = Number(leaveRequestId)
  const validId = Number.isInteger(leaveId) && leaveId > 0

  const { data: detail, error, isLoading } = useLeaveDetail(
    validId ? leaveId : null,
  )

  const listTab = listTabFromLocationState(location.state, 'pending')
  const backToList = listPathWithTab('/admin/leave-requests', listTab)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(
    null,
  )
  const [actionError, setActionError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFiles, setPreviewFiles] = useState<AttachmentFile[]>([])

  const uiStatus = detail ? mapApiLeaveStatusToUi(detail.status) : null
  const conversion = detail?.conversion ?? null
  const eligibleApprovers = detail?.eligible_approvers ?? []
  const requirements = detail?.approval_requirements ?? []

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

  const usesConversionReview = isConversionReviewStatus(detail?.status)

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

  const canActConversion = useMemo(() => {
    if (!detail || !conversion) return false
    if (detail.status !== 'pending_conversion') return false
    if (conversion.status !== 'pending_review') return false
    if (!user.roles.admin) return false
    return eligibleApprovers.some(
      (approver) =>
        String(approver.emp_id) === String(user.id) &&
        approver.approver_type === 'admin',
    )
  }, [conversion, detail, eligibleApprovers, user.id, user.roles.admin])

  const canActSickLeave = useMemo(() => {
    if (!detail || !user.roles.admin) return false
    if (detail.status !== 'pending_approval') return false
    if (!isAdminApproved(detail.leave_type.code)) return false
    return eligibleApprovers.some(
      (approver) =>
        String(approver.emp_id) === String(user.id) &&
        approver.approver_type === 'admin',
    )
  }, [detail, eligibleApprovers, user.id, user.roles.admin])

  const canAct = canActConversion || canActSickLeave

  const decisionSettled = isLeaveDecisionSettled(detail?.status)

  const employee = detail?.employee ?? null
  const employeeNumber = employee?.employee_number ?? '—'
  const employeeName = employee?.name?.trim() || '—'
  const departmentLabel = orgLabel(employee?.department)
  const groupLabel = orgLabel(employee?.group)

  const conversionPanels: LeaveConversionInfo | null =
    detail && conversion
      ? {
          status: conversion.status,
          originalLeaveType:
            conversion.from_leave_type?.name ?? detail.leave_type.name,
          originalDayType: formatDayTypeLabel(detail.day_type),
          originalDateFiled: formatShortDate(detail.created_at),
          originalLeavePeriod: formatLeavePeriod(
            detail.start_date,
            detail.end_date,
          ),
          filedBy: filedByLabel(detail),
          originalReason: detail.leave_reason,
          originalAttachmentCount: detail.attachments?.length ?? 0,
          requestedLeaveType: conversion.to_leave_type?.name ?? '—',
          conversionRequestDate: formatShortDate(conversion.created_at),
          conversionReason: conversion.reason?.trim() || '—',
          conversionAttachmentCount: conversion.med_certs?.length ?? 0,
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
    (error instanceof ApiError &&
      (error.status === 404 || error.status === 403)) ||
    (!isLoading && !detail && error != null)

  function openPreview(files: AttachmentFile[]) {
    if (files.length === 0) return
    setPreviewFiles(files)
    setPreviewOpen(true)
  }

  function openPreviewFromConversion(kind: 'original' | 'conversion') {
    if (!detail) return
    if (kind === 'conversion') {
      openPreview(previewFilesFromStored(conversion?.med_certs))
      return
    }
    openPreview(previewFilesFromStored(detail.attachments))
  }

  async function revalidateCaches(leaveIdToRefresh: number) {
    await Promise.all([
      mutate(swrKeys.leave(leaveIdToRefresh)),
      mutate(swrKeys.pendingConversions),
      mutate(swrKeys.pendingApprovals),
      mutate(isAdminLeavesListKey, undefined, { revalidate: true }),
      mutate(swrKeys.leaveLwop()),
    ])
  }

  async function handleRejectConfirm(reason: string) {
    if (!detail) return
    if (canActConversion && !conversion) return

    setRejectOpen(false)
    setPendingAction('reject')
    setActionError(null)

    try {
      if (canActConversion && conversion) {
        await rejectConversion(conversion.id, {
          remarks: reason.trim(),
        })
        toast.success(TOAST_LEAVE_CONVERSION_REJECTED)
      } else {
        await rejectLeave(detail.id, {
          remarks: reason.trim(),
        })
        toast.success(TOAST_LEAVE_REQUEST_REJECTED)
      }
      await revalidateCaches(detail.id)
      navigate(backToList)
    } catch (err) {
      setActionError(
        messageFromApiError(
          err,
          canActConversion
            ? 'Unable to reject conversion request. Please try again.'
            : 'Unable to reject leave request. Please try again.',
        ),
      )
    } finally {
      setPendingAction(null)
    }
  }

  async function handleApproveConfirm() {
    if (!detail) return
    if (canActConversion && !conversion) return

    setApproveOpen(false)
    setPendingAction('approve')
    setActionError(null)

    try {
      if (canActConversion && conversion) {
        await approveConversion(conversion.id)
        toast.success(TOAST_LEAVE_CONVERSION_APPROVED)
      } else {
        await approveLeave(detail.id)
        toast.success(TOAST_LEAVE_REQUEST_APPROVED)
      }
      await revalidateCaches(detail.id)
      navigate(backToList)
    } catch (err) {
      setActionError(
        messageFromApiError(
          err,
          canActConversion
            ? 'Unable to approve conversion request. Please try again.'
            : 'Unable to approve leave request. Please try again.',
        ),
      )
    } finally {
      setPendingAction(null)
    }
  }

  if (isLoading) {
    return (
      <LeaveDetailLoadingView
        backTo={backToList}
        backLabel="Back to Leave Requests"
        infoLayout="validate"
      />
    )
  }

  if (notFound || !detail || !uiStatus) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <PageBackLink to={backToList}>Back to Leave Requests</PageBackLink>
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
      <PageBackLink to={backToList}>Back to Leave Requests</PageBackLink>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <h1 className="text-h1 text-text-black">
          {conversion ? 'Leave Conversion Request' : detail.leave_type.name}
        </h1>
        <StatusBadge
          status={uiStatus}
          label={
            detail.status === 'pending_conversion' ||
            (detail.status === 'pending_approval' &&
              isAdminApproved(detail.leave_type.code))
              ? 'PENDING VALIDATION'
              : undefined
          }
        />
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

      <article className="shrink-0 rounded-lg border border-border bg-surface px-5 py-4">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border">
          <InfoCell label="Employee No." value={employeeNumber} />
          <InfoCell
            label="Employee Name"
            value={employeeName}
            className="lg:pl-4"
          />
          <InfoCell
            label="Department"
            value={departmentLabel}
            className="lg:pl-4"
          />
          <InfoCell label="Group" value={groupLabel} className="lg:pl-4" />
        </dl>
      </article>

      {conversionPanels ? (
        <LeaveConversionPanels
          conversion={conversionPanels}
          onPreview={openPreviewFromConversion}
          spacing="compact"
        />
      ) : (
        <article className="shrink-0 rounded-lg border border-border bg-surface p-4">
          <h2 className="text-h2 text-text-black">Leave Request Summary</h2>
          <dl className={`mt-3 ${INFO_FIELD_GRID_CLASS}`}>
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
              value={formatDurationDays(detail.duration, detail.day_type)}
            />
            <SpecialLeaveDetailRows
              assignmentTypeLabel={detail.assignment_type_label}
              specialLeaveReasonLabel={detail.special_leave_reason_label}
            />
            {!isSpecialLeave(detail.leave_type.code) ? (
              <LeaveInfoRow label="Reason" value={detail.leave_reason} />
            ) : null}
            <LeaveAttachmentRow
              fileCount={detail.attachments?.length ?? 0}
              alwaysShow={requiresAttachment(detail.leave_type.code)}
              onView={() =>
                openPreview(previewFilesFromStored(detail.attachments))
              }
            />
          </dl>
        </article>
      )}

      <ApprovalDetailsTable
        approvers={approverRows}
        decisionSettled={Boolean(decisionSettled)}
        currentUserId={String(user.id)}
      />

      {canAct ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="dangerOutline"
            disabled={pendingAction != null}
            loading={pendingAction === 'reject'}
            loadingText="Rejecting…"
            onClick={() => {
              setActionError(null)
              setRejectOpen(true)
            }}
          >
            <X className="size-4" aria-hidden="true" />
            Reject
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={pendingAction != null}
            loading={pendingAction === 'approve'}
            loadingText="Approving…"
            onClick={() => {
              setActionError(null)
              setApproveOpen(true)
            }}
          >
            <Check className="size-4 text-white" aria-hidden="true" />
            Approve
          </Button>
        </div>
      ) : null}

      <ConfirmReasonModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={(reason) => {
          void handleRejectConfirm(reason)
        }}
        title={
          canActConversion ? 'Reject leave conversion' : 'Reject leave request'
        }
        description={
          canActConversion
            ? 'Please provide a reason for rejecting this conversion request.'
            : 'Please provide a reason for rejecting this leave request.'
        }
        confirmLabel="Reject"
        cancelLabel="Cancel"
        confirmVariant="danger"
        iconVariant="reject"
      />

      <ConfirmReasonModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={() => {
          void handleApproveConfirm()
        }}
        requireReason={false}
        title={
          canActConversion ? 'Approve leave conversion' : 'Approve leave request'
        }
        description={
          canActConversion
            ? 'Are you sure you want to approve this leave conversion request?'
            : 'Are you sure you want to approve this leave request?'
        }
        confirmLabel="Approve"
        cancelLabel="Cancel"
        confirmVariant="primary"
        iconVariant="approve"
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
