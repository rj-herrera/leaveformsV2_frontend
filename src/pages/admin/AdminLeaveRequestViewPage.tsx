import { useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { ApiError } from '../../api/axios-client'
import { conversionMedCertPath } from '../../api/conversions'
import { leaveAttachmentPath } from '../../api/leaves'
import type { AdminReminderStats } from '../../api/reminders'
import {
  isReminderPairReminded,
  sendLeaveReminder,
  statsAfterReminder429,
  statsAfterSingleSend,
} from '../../api/reminders'
import { useAuth } from '../../auth/AuthContext'
import { ApprovalDetailsTable } from '../../components/leave/ApprovalDetailsTable'
import { LeaveAttachmentRow } from '../../components/leave/LeaveAttachmentRow'
import { LeaveConversionPanels } from '../../components/leave/LeaveConversionPanels'
import { LeaveInfoRow } from '../../components/leave/LeaveInfoRow'
import { AttachmentPreviewModal } from '../../components/ui/AttachmentPreviewModal'
import { ConfirmReasonModal } from '../../components/ui/ConfirmReasonModal'
import { PageBackLink } from '../../components/ui/PageBackLink'
import { LeaveDetailLoadingView } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/ToastProvider'
import { INFO_FIELD_GRID_CLASS } from '../../components/ui/tableStyles'
import { TOAST_REMINDER_SENT_TO_APPROVER } from '../../constants/toastMessages'
import { useAdminReminders } from '../../hooks/api/useAdminReminders'
import { useLeaveDetail } from '../../hooks/api/useLeaveDetail'
import { swrKeys } from '../../hooks/api/swrKeys'
import type { LeaveConversionInfo } from '../../mocks/leaveRequests'
import type { ApproverRow } from '../../types/approverRow'
import { formatDayTypeLabel } from '../../utils/leaveDates'
import { isAdminApproved, requiresAttachment } from '../../utils/leaveFiling'
import {
  formatDateTime,
  formatDurationDays,
  formatLeavePeriod,
  formatShortDate,
  mapApiLeaveStatusToUi,
} from '../../utils/leaveDisplay'
import {
  listPathWithTab,
  listTabFromLocationState,
} from '../../utils/listTab'

const ATTACHMENT_LABEL = 'Leave attachment'
const MED_CERT_LABEL = 'Medical certificate'

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

function messageFromReminderError(error: unknown): string {
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
  return 'Unable to send reminder. Please try again.'
}

export function AdminLeaveRequestViewPage() {
  const { leaveRequestId } = useParams<{ leaveRequestId: string }>()
  const location = useLocation()
  const { user } = useAuth()
  const { mutate } = useSWRConfig()
  const toast = useToast()

  const leaveId = Number(leaveRequestId)
  const validId = Number.isInteger(leaveId) && leaveId > 0

  const { data: detail, error, isLoading } = useLeaveDetail(
    validId ? leaveId : null,
  )
  const { data: reminderStats } = useAdminReminders(user.roles.admin)

  const listTab = listTabFromLocationState(location.state, 'all')
  const backToList = listPathWithTab('/admin/leave-requests', listTab)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFileName, setPreviewFileName] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [reminderTarget, setReminderTarget] = useState<ApproverRow | null>(
    null,
  )
  const [reminderSending, setReminderSending] = useState(false)
  const [reminderError, setReminderError] = useState<string | null>(null)

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

  const usesConversionReview =
    detail?.status === 'pending_conversion' ||
    detail?.status === 'converted_to_sl'

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

  const conversionPanels: LeaveConversionInfo | null =
    detail && conversion && conversion.status !== 'rejected'
      ? {
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
          originalAttachment: detail.has_attachment ? ATTACHMENT_LABEL : null,
          requestedLeaveType: conversion.to_leave_type?.name ?? 'Sick Leave',
          conversionRequestDate: formatShortDate(conversion.created_at),
          conversionReason: conversion.reason?.trim() || '—',
          conversionAttachment: conversion.has_med_cert
            ? MED_CERT_LABEL
            : null,
        }
      : null

  const showReminderActions =
    user.roles.admin &&
    detail?.status === 'pending_approval' &&
    !isAdminApproved(detail.leave_type.code)

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

  function openPreviewFromAttachmentLabel(value: string | null | undefined) {
    if (!value || !detail) return
    if (value === MED_CERT_LABEL && conversion) {
      openPreview(MED_CERT_LABEL, conversionMedCertPath(conversion.id))
      return
    }
    openPreview(
      ATTACHMENT_LABEL,
      detail.has_attachment ? leaveAttachmentPath(detail.id) : null,
    )
  }

  function canRemind(approver: ApproverRow): boolean {
    if (!showReminderActions || reminderSending || !detail) return false
    if (approver.role === 'admin') return false
    if (approver.status !== 'no_action') return false
    const approverEmpId = Number(approver.id)
    if (
      isReminderPairReminded(
        reminderStats?.reminded_pairs,
        detail.id,
        approverEmpId,
      )
    ) {
      return false
    }
    return true
  }

  async function handleReminderConfirm() {
    if (!detail || !reminderTarget) return

    const approverEmpId = Number(reminderTarget.id)
    if (!Number.isInteger(approverEmpId) || approverEmpId <= 0) return

    setReminderTarget(null)
    setReminderSending(true)
    setReminderError(null)

    try {
      await sendLeaveReminder(detail.id, approverEmpId)
      await mutate(
        swrKeys.adminReminders,
        (current: AdminReminderStats | undefined) =>
          statsAfterSingleSend(current, detail.id, approverEmpId),
        { revalidate: true },
      )
      toast.success(TOAST_REMINDER_SENT_TO_APPROVER)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        await mutate(
          swrKeys.adminReminders,
          (current: AdminReminderStats | undefined) =>
            statsAfterReminder429(current, err.body, {
              leaveId: detail.id,
              approverEmpId,
            }),
          { revalidate: true },
        )
      }
      setReminderError(messageFromReminderError(err))
    } finally {
      setReminderSending(false)
    }
  }

  if (isLoading) {
    return (
      <LeaveDetailLoadingView
        backTo={backToList}
        backLabel="Back to Leave Requests"
        infoLayout="admin-view"
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
        <h1 className="text-h1 text-text-black">{detail.leave_type.name}</h1>
        <StatusBadge status={uiStatus} />
      </div>

      {reminderError ? (
        <div
          className="flex shrink-0 gap-2 rounded-md border-2 border-status-rejected bg-status-rejected/10 px-3 py-2.5"
          role="alert"
        >
          <p className="text-small font-semibold text-status-rejected">
            {reminderError}
          </p>
        </div>
      ) : null}

      {conversionPanels ? (
        <>
          <article className="shrink-0 rounded-lg border border-border bg-surface p-4">
            <h2 className="text-h2 text-text-black">Employee Information</h2>
            <dl className={`mt-3 ${INFO_FIELD_GRID_CLASS}`}>
              <LeaveInfoRow label="Employee No." value={employeeNumber} />
              <LeaveInfoRow label="Employee Name" value={employeeName} />
              <LeaveInfoRow label="Department" value={departmentLabel} />
              <LeaveInfoRow label="Group" value={groupLabel} />
            </dl>
          </article>
          <LeaveConversionPanels
            conversion={conversionPanels}
            onPreview={openPreviewFromAttachmentLabel}
            spacing="compact"
          />
        </>
      ) : (
        <section className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch">
          <article className="flex flex-col rounded-lg border border-border bg-surface p-4">
            <h2 className="text-h2 text-text-black">Employee Information</h2>
            <dl className={`mt-3 ${INFO_FIELD_GRID_CLASS}`}>
              <LeaveInfoRow label="Employee No." value={employeeNumber} />
              <LeaveInfoRow label="Employee Name" value={employeeName} />
              <LeaveInfoRow label="Department" value={departmentLabel} />
              <LeaveInfoRow label="Group" value={groupLabel} />
            </dl>
          </article>
          <article className="flex flex-col rounded-lg border border-border bg-surface p-4">
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
              <LeaveInfoRow label="Filed By" value={filedByLabel(detail)} />
              <LeaveInfoRow
                label="Duration"
                value={formatDurationDays(detail.duration)}
              />
              <LeaveInfoRow label="Reason" value={detail.leave_reason} />
              <LeaveAttachmentRow
                value={detail.has_attachment ? ATTACHMENT_LABEL : null}
                alwaysShow={requiresAttachment(detail.leave_type.code)}
                onView={() =>
                  openPreview(
                    ATTACHMENT_LABEL,
                    detail.has_attachment
                      ? leaveAttachmentPath(detail.id)
                      : null,
                  )
                }
              />
            </dl>
          </article>
        </section>
      )}

      <ApprovalDetailsTable
        approvers={approverRows}
        decisionSettled={Boolean(decisionSettled)}
        currentUserId={String(user.id)}
        youBadgeVariant="muted"
        canRemind={showReminderActions ? canRemind : undefined}
        onRemind={showReminderActions ? setReminderTarget : undefined}
      />

      <ConfirmReasonModal
        open={reminderTarget !== null}
        onClose={() => setReminderTarget(null)}
        onConfirm={() => {
          void handleReminderConfirm()
        }}
        requireReason={false}
        title="Send Reminder"
        description={
          reminderTarget ? (
            <>
              Send a reminder to{' '}
              <span className="font-semibold text-status-pending-conversion">
                {reminderTarget.name}
              </span>{' '}
              that this leave request still needs their action?
            </>
          ) : (
            'Send a reminder to this approver?'
          )
        }
        confirmLabel="Send Reminder"
        cancelLabel="Cancel"
        confirmVariant="reminder"
        iconVariant="reminder"
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
