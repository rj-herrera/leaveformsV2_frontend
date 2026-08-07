/**
 * TODO(REPLACE): Shared mock leave data — connected org sample
 * (Employee → Approver → Admin).
 *
 * Org:
 * - Employee: Alex Employee (SYS)
 * - Group approvers: Jordan + Approver 2–4
 * - Admin: Casey Admin
 *
 * Approval rule: one group-approver approval finalizes leave.
 * Conversions / special leaves may still need Admin validation.
 */
import type { UserRole } from '../auth/AuthContext'
import type { LeaveRequestStatus } from '../constants/leaveStatus'
import {
  hasFiledParentalLeaveRequest,
  isParentalLeaveType,
} from './leaveBalances'
import { MOCK_DATA_ENABLED } from './config'
import {
  formatDayTypeLabel,
  inferDayTypeFromDuration,
} from '../utils/leaveDates'

export type LeaveRequestSummary = {
  id: string
  leaveType: string
  filedOnDate: string
  filedOnLabel: string
  period: string
  duration: string
  status: LeaveRequestStatus
  requesterId: string
  requesterName: string
  employeeNumber: string
  groupId: string
  groupLabel: string
}

export type ApproverListItem = LeaveRequestSummary & {
  department: string
  needsAction: boolean
}

export type ApproverRowStatus = 'approved' | 'no_action' | 'rejected'

export type ApproverRow = {
  id: string
  name: string
  status: ApproverRowStatus
  actionDate: string | null
  remarks: string | null
  role: 'approver' | 'admin'
  purpose?: string
}

export type ApprovalRequirement = {
  id: string
  label: string
  status: 'completed' | 'pending'
}

export type LeaveConversionInfo = {
  originalLeaveType: string
  originalDayType: string
  originalDateFiled: string
  originalLeavePeriod: string
  filedBy: string
  originalReason: string
  originalAttachment: string | null
  requestedLeaveType: string
  conversionRequestDate: string
  conversionReason: string
  conversionAttachment: string | null
}

export type LeaveRequestDetail = LeaveRequestSummary & {
  dateFiled: string
  leavePeriod: string
  reason: string
  department: string
  approvalsCompleted: number
  approvalsRequired: number
  requirements: ApprovalRequirement[]
  attachmentNote: string | null
  attachmentFileName: string | null
  approvers: ApproverRow[]
  conversion: LeaveConversionInfo | null
}

export const MOCK_GROUP = {
  id: 'group-alpha',
  name: 'Alpha Team',
  label: 'SYS',
  department: 'Solution',
  employee: {
    id: 'user-employee',
    name: 'Alex Employee',
    employeeNumber: '801',
  },
  approvers: [
    { id: 'user-approver', name: 'Jordan Approver', employeeNumber: '802' },
    { id: 'user-approver-2', name: 'Approver 2', employeeNumber: '804' },
    { id: 'user-approver-3', name: 'Approver 3', employeeNumber: '805' },
    { id: 'user-approver-4', name: 'Approver 4', employeeNumber: '806' },
  ],
  admin: {
    id: 'user-admin',
    name: 'Casey Admin',
    employeeNumber: '803',
  },
} as const

const JORDAN = MOCK_GROUP.approvers[0]
const APPROVER_2 = MOCK_GROUP.approvers[1]
const APPROVER_3 = MOCK_GROUP.approvers[2]
const APPROVER_4 = MOCK_GROUP.approvers[3]
const ADMIN = MOCK_GROUP.admin
const EMPLOYEE = MOCK_GROUP.employee

const CECILE = {
  id: 'user-cecile',
  name: 'Cecile Santos',
  employeeNumber: '810',
}
const MELISSA = {
  id: 'user-melissa',
  name: 'Melissa Aguilar',
  employeeNumber: '811',
}
const PAUL = {
  id: 'user-paul',
  name: 'Paul Hernandez',
  employeeNumber: '899',
}
const SAM = {
  id: 'user-employee-2',
  name: 'Sam Rivera',
  employeeNumber: '807',
}
const TAYLOR = {
  id: 'user-employee-3',
  name: 'Taylor Cruz',
  employeeNumber: '808',
}
const SALLY = {
  id: 'user-sally',
  name: 'Sally Bautista',
  employeeNumber: '812',
}
const EMMAN = {
  id: 'user-emman',
  name: 'Emman De Leon',
  employeeNumber: '813',
}

export function summaryFields(
  person: { id: string; name: string; employeeNumber: string },
  group: { id: string; label: string } = MOCK_GROUP,
) {
  return {
    requesterId: person.id,
    requesterName: person.name,
    employeeNumber: person.employeeNumber,
    groupId: group.id,
    groupLabel: group.label,
  }
}

export function approverRow(
  person: { id: string; name: string },
  status: ApproverRowStatus,
  actionDate: string | null = null,
  remarks: string | null = null,
  role: 'approver' | 'admin' = 'approver',
  purpose?: string,
): ApproverRow {
  return {
    id: person.id,
    name: person.name,
    status,
    actionDate,
    remarks,
    role,
    purpose,
  }
}

export function detailFromSummary(
  summary: LeaveRequestSummary,
  extras: Omit<
    LeaveRequestDetail,
    | keyof LeaveRequestSummary
    | 'dateFiled'
    | 'leavePeriod'
    | 'attachmentFileName'
    | 'conversion'
    | 'department'
  > &
    Partial<
      Pick<
        LeaveRequestDetail,
        | 'dateFiled'
        | 'leavePeriod'
        | 'attachmentFileName'
        | 'conversion'
        | 'department'
      >
    >,
): LeaveRequestDetail {
  return {
    ...summary,
    dateFiled: extras.dateFiled ?? summary.filedOnLabel,
    leavePeriod: extras.leavePeriod ?? summary.period,
    reason: extras.reason,
    department: extras.department ?? MOCK_GROUP.department,
    approvalsCompleted: extras.approvalsCompleted,
    approvalsRequired: extras.approvalsRequired,
    requirements: extras.requirements,
    attachmentNote: extras.attachmentNote,
    attachmentFileName: extras.attachmentFileName ?? null,
    approvers: extras.approvers,
    conversion: extras.conversion ?? null,
  }
}

function groupFields(label: string, id = `group-${label.toLowerCase()}`) {
  return { id, label }
}

/** Alex — My Leave dashboard */
const EMPLOYEE_OWN_REQUESTS: LeaveRequestSummary[] = [
  {
    id: 'emp-1',
    leaveType: 'Vacation Leave',
    filedOnDate: '2026-06-15',
    filedOnLabel: 'Jun 15, 2026',
    period: 'Jul 20–22, 2026',
    duration: '3 days',
    status: 'APPROVED',
    ...summaryFields(EMPLOYEE),
  },
  {
    id: 'emp-2',
    leaveType: 'Vacation Leave',
    filedOnDate: '2026-07-08',
    filedOnLabel: 'Jul 8, 2026',
    period: 'Jul 10, 2026',
    duration: '1 day',
    status: 'APPROVED',
    ...summaryFields(EMPLOYEE),
  },
  {
    id: 'emp-3',
    leaveType: 'Sick Leave',
    filedOnDate: '2026-06-20',
    filedOnLabel: 'Jun 20, 2026',
    period: 'Jun 25, 2026',
    duration: '1 day',
    status: 'APPROVED',
    ...summaryFields(EMPLOYEE),
  },
  {
    id: 'emp-4',
    leaveType: 'Vacation Leave',
    filedOnDate: '2026-07-01',
    filedOnLabel: 'Jul 1, 2026',
    period: 'Jul 27–29, 2026',
    duration: '3 days',
    status: 'PENDING',
    ...summaryFields(EMPLOYEE),
  },
  {
    id: 'emp-5',
    leaveType: 'Vacation Leave',
    filedOnDate: '2026-07-01',
    filedOnLabel: 'Jul 1, 2026',
    period: 'Jul 13, 2026',
    duration: '1 day',
    status: 'APPROVED',
    ...summaryFields(EMPLOYEE),
  },
  {
    id: 'emp-6',
    leaveType: 'Vacation Leave',
    filedOnDate: '2026-07-18',
    filedOnLabel: 'Jul 18, 2026',
    period: 'Aug 3–5, 2026',
    duration: '3 days',
    status: 'REJECTED',
    ...summaryFields(EMPLOYEE),
  },
]

/** Jordan — own leave as employee+approver */
const APPROVER_OWN_REQUESTS: LeaveRequestSummary[] = [
  {
    id: 'apr-1',
    leaveType: 'Vacation Leave',
    filedOnDate: '2026-07-12',
    filedOnLabel: 'Jul 12, 2026',
    period: 'Jul 22–23, 2026',
    duration: '2 days',
    status: 'PENDING',
    ...summaryFields(JORDAN),
  },
  {
    id: 'apr-2',
    leaveType: 'Paternity Leave',
    filedOnDate: '2026-06-01',
    filedOnLabel: 'Jun 1, 2026',
    period: 'Jul 20–28, 2026',
    duration: '7 days',
    status: 'APPROVED',
    ...summaryFields(JORDAN),
  },
  {
    id: 'apr-3',
    leaveType: 'Emergency Leave',
    filedOnDate: '2026-07-14',
    filedOnLabel: 'Jul 14, 2026',
    period: 'Jul 21, 2026',
    duration: '1 day',
    status: 'REJECTED',
    ...summaryFields(JORDAN),
  },
]

/** Casey — own leave */
const ADMIN_OWN_REQUESTS: LeaveRequestSummary[] = [
  {
    id: 'adm-1',
    leaveType: 'Vacation Leave',
    filedOnDate: '2026-07-08',
    filedOnLabel: 'Jul 8, 2026',
    period: 'Jul 14–15, 2026',
    duration: '2 days',
    status: 'PENDING',
    ...summaryFields(ADMIN),
  },
  {
    id: 'adm-2',
    leaveType: 'Emergency Leave',
    filedOnDate: '2026-05-30',
    filedOnLabel: 'May 30, 2026',
    period: 'May 31, 2026',
    duration: '1 day',
    status: 'APPROVED',
    ...summaryFields(ADMIN),
  },
  {
    id: 'adm-3',
    leaveType: 'Vacation Leave',
    filedOnDate: '2026-07-09',
    filedOnLabel: 'Jul 9, 2026',
    period: 'Jul 28–29, 2026',
    duration: '2 days',
    status: 'REJECTED',
    ...summaryFields(ADMIN),
  },
]

/** Other org members — Admin master list / calendar / reminders */
const OTHER_ORG_REQUESTS: LeaveRequestSummary[] = [
  {
    id: 'org-cecile-1',
    leaveType: 'Sick Leave – Converted from VL',
    filedOnDate: '2026-07-02',
    filedOnLabel: 'Jul 2, 2026',
    period: 'Jul 1, 2026',
    duration: '1 day',
    status: 'PENDING_CONVERSION',
    ...summaryFields(CECILE, groupFields('CIV')),
  },
  {
    id: 'org-melissa-1',
    leaveType: 'Maternity Leave',
    filedOnDate: '2026-06-22',
    filedOnLabel: 'Jun 22, 2026',
    period: 'Aug 17–Nov 29, 2026',
    duration: '105 days',
    status: 'PENDING_CONVERSION',
    ...summaryFields(MELISSA, groupFields('PIP')),
  },
  {
    id: 'org-paul-1',
    leaveType: 'Paternity Leave',
    filedOnDate: '2026-06-01',
    filedOnLabel: 'Jun 1, 2026',
    period: 'Jul 20–28, 2026',
    duration: '7 days',
    status: 'APPROVED',
    ...summaryFields(PAUL, groupFields('PIP')),
  },
  {
    id: 'org-sam-1',
    leaveType: 'Vacation Leave',
    filedOnDate: '2026-07-05',
    filedOnLabel: 'Jul 5, 2026',
    period: 'Jul 30–31, 2026',
    duration: '2 days',
    status: 'PENDING',
    ...summaryFields(SAM),
  },
  {
    id: 'org-taylor-1',
    leaveType: 'Emergency Leave',
    filedOnDate: '2026-07-10',
    filedOnLabel: 'Jul 10, 2026',
    period: 'Jul 24, 2026',
    duration: '1 day',
    status: 'APPROVED',
    ...summaryFields(TAYLOR, groupFields('IT')),
  },
  {
    id: 'org-sally-1',
    leaveType: 'Vacation Leave',
    filedOnDate: '2026-07-06',
    filedOnLabel: 'Jul 6, 2026',
    period: 'Jul 13, 2026',
    duration: '1 day',
    status: 'APPROVED',
    ...summaryFields(SALLY),
  },
  {
    id: 'org-emman-1',
    leaveType: 'Vacation Leave',
    filedOnDate: '2026-07-07',
    filedOnLabel: 'Jul 7, 2026',
    period: 'Jul 15–17, 2026',
    duration: '3 days',
    status: 'APPROVED',
    ...summaryFields(EMMAN),
  },
]

const ALL_ORG_REQUESTS: LeaveRequestSummary[] = [
  ...EMPLOYEE_OWN_REQUESTS,
  ...APPROVER_OWN_REQUESTS,
  ...ADMIN_OWN_REQUESTS,
  ...OTHER_ORG_REQUESTS,
]

export const ROLE_LEAVE_REQUESTS: Record<UserRole, LeaveRequestSummary[]> = {
  employee: EMPLOYEE_OWN_REQUESTS,
  approver: APPROVER_OWN_REQUESTS,
  admin: ADMIN_OWN_REQUESTS,
}

type ConversionSubmission = {
  reason: string
  attachmentFileName: string
  submittedAtLabel: string
}

const conversionSubmissions: Record<string, ConversionSubmission> = {}

function formatDisplayDate(date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function submitVlToSlConversion(
  requestId: string,
  payload: { reason: string; attachmentFileName: string },
): LeaveRequestDetail | null {
  const base = LEAVE_REQUEST_DETAILS[requestId]
  if (!base) return null
  if (base.leaveType !== 'Vacation Leave' || base.status !== 'APPROVED') {
    return null
  }

  conversionSubmissions[requestId] = {
    reason: payload.reason,
    attachmentFileName: payload.attachmentFileName,
    submittedAtLabel: formatDisplayDate(),
  }

  return getLeaveRequestDetail(requestId)
}

function applyConversionSubmission(
  base: LeaveRequestDetail,
  submission: ConversionSubmission,
): LeaveRequestDetail {
  const originalApprovers = base.approvers.map((row) => ({
    ...row,
    purpose: row.purpose ?? 'Leave approval',
  }))

  const hasAdmin = originalApprovers.some((row) => row.role === 'admin')
  const approvers = hasAdmin
    ? originalApprovers.map((row) =>
        row.role === 'admin'
          ? {
              ...row,
              status: 'no_action' as const,
              actionDate: null,
              remarks: null,
              purpose: 'Admin validation',
            }
          : row,
      )
    : [
        ...originalApprovers,
        approverRow(
          ADMIN,
          'no_action',
          null,
          null,
          'admin',
          'Admin validation',
        ),
      ]

  return {
    ...base,
    status: 'PENDING_CONVERSION',
    leaveType: 'Vacation Leave',
    approvalsCompleted: 0,
    approvalsRequired: 1,
    requirements: [
      {
        id: 'r1',
        label: 'Admin validation',
        status: 'pending',
      },
    ],
    conversion: {
      originalLeaveType: base.leaveType,
      originalDayType: formatDayTypeLabel(
        inferDayTypeFromDuration(base.duration),
      ),
      originalDateFiled: base.dateFiled,
      originalLeavePeriod: base.leavePeriod,
      filedBy: base.requesterName,
      originalReason: base.reason,
      originalAttachment: base.attachmentFileName,
      requestedLeaveType: 'Sick Leave',
      conversionRequestDate: submission.submittedAtLabel,
      conversionReason: submission.reason,
      conversionAttachment: submission.attachmentFileName,
    },
    approvers,
  }
}

function withConversionOverlay(
  request: LeaveRequestSummary,
): LeaveRequestSummary {
  if (conversionSubmissions[request.id]) {
    return { ...request, status: 'PENDING_CONVERSION' }
  }
  return request
}

export function getLeaveRequestsForRole(role: UserRole): LeaveRequestSummary[] {
  if (!MOCK_DATA_ENABLED) return []
  return ROLE_LEAVE_REQUESTS[role].map(withConversionOverlay)
}

/**
 * Maternity / Paternity credits are visible only after a matching leave request
 * exists (filed parental record or any org leave request of that type).
 */
export function canViewParentalLeaveCredits(
  employeeId: string,
  leaveType: string,
): boolean {
  if (!employeeId || !isParentalLeaveType(leaveType)) return true
  if (hasFiledParentalLeaveRequest(employeeId, leaveType)) return true
  if (!MOCK_DATA_ENABLED) return false
  return ALL_ORG_REQUESTS.some(
    (request) =>
      request.requesterId === employeeId && request.leaveType === leaveType,
  )
}

export function getApproverInboxRequests(): LeaveRequestSummary[] {
  return getApproverVisibleRequests(JORDAN.id)
}

export function hasFinalizingApproverAction(
  detail: LeaveRequestDetail,
): boolean {
  return detail.approvers.some(
    (row) =>
      row.role === 'approver' &&
      (row.status === 'approved' || row.status === 'rejected'),
  )
}

/** Group approver reminders only while the request still needs an approval. */
export function canSendApproverReminder(
  detail: LeaveRequestDetail,
  approver: ApproverRow,
): boolean {
  if (approver.role !== 'approver') return false
  if (approver.status !== 'no_action') return false
  if (detail.status !== 'PENDING') return false
  if (hasFinalizingApproverAction(detail)) return false
  return true
}

function toApproverListItem(
  detail: LeaveRequestDetail,
  approverUserId: string,
): ApproverListItem {
  const needsAction = isApproverActionable(detail, approverUserId)

  return {
    id: detail.id,
    leaveType: detail.leaveType,
    filedOnDate: detail.filedOnDate,
    filedOnLabel: detail.filedOnLabel,
    period: detail.period,
    duration: detail.duration,
    status: detail.status,
    requesterId: detail.requesterId,
    requesterName: detail.requesterName,
    employeeNumber: detail.employeeNumber,
    groupId: detail.groupId,
    groupLabel: detail.groupLabel,
    department: detail.department,
    needsAction,
  }
}

export function getApproverQueue(approverUserId: string): ApproverListItem[] {
  return getApproverVisibleRequests(approverUserId).filter(
    (item) => item.needsAction,
  )
}

export function getApproverVisibleRequests(
  approverUserId: string,
): ApproverListItem[] {
  if (!MOCK_DATA_ENABLED) return []

  const items: ApproverListItem[] = []
  for (const summary of ALL_ORG_REQUESTS) {
    const detail = getLeaveRequestDetail(summary.id)
    if (!detail) continue
    if (!detail.approvers.some((row) => row.id === approverUserId)) continue
    items.push(toApproverListItem(detail, approverUserId))
  }

  return items.sort((a, b) => b.filedOnDate.localeCompare(a.filedOnDate))
}

export function isApproverActionable(
  detail: LeaveRequestDetail,
  approverUserId: string,
): boolean {
  if (detail.status === 'PENDING_CONVERSION') {
    return detail.approvers.some(
      (row) =>
        row.id === approverUserId &&
        row.role === 'admin' &&
        row.status === 'no_action',
    )
  }

  if (detail.status !== 'PENDING') return false
  if (hasFinalizingApproverAction(detail)) return false

  return detail.approvers.some(
    (row) =>
      row.id === approverUserId &&
      row.role === 'approver' &&
      row.status === 'no_action',
  )
}

export function getAdminMasterListRequests(): LeaveRequestSummary[] {
  if (!MOCK_DATA_ENABLED) return []
  return ALL_ORG_REQUESTS.map(withConversionOverlay)
}

export function getAdminPendingValidation(): ApproverListItem[] {
  if (!MOCK_DATA_ENABLED) return []
  return getAdminMasterListRequests()
    .map((summary) => {
      const detail = getLeaveRequestDetail(summary.id)
      if (!detail || detail.status !== 'PENDING_CONVERSION') return null
      return toApproverListItem(detail, ADMIN.id)
    })
    .filter((item): item is ApproverListItem => item !== null)
    .sort((a, b) => b.filedOnDate.localeCompare(a.filedOnDate))
}

export function getAdminAllLeaveRequests(): ApproverListItem[] {
  if (!MOCK_DATA_ENABLED) return []
  return getAdminMasterListRequests()
    .map((summary) => {
      const detail = getLeaveRequestDetail(summary.id)
      if (!detail) return null
      return toApproverListItem(detail, ADMIN.id)
    })
    .filter((item): item is ApproverListItem => item !== null)
    .sort((a, b) => b.filedOnDate.localeCompare(a.filedOnDate))
}

export function getAdminPendingApproverReminderStats(): {
  approverCount: number
  requestCount: number
} {
  if (!MOCK_DATA_ENABLED) {
    return { approverCount: 0, requestCount: 0 }
  }

  const pendingApproverIds = new Set<string>()
  let requestCount = 0

  for (const summary of getAdminMasterListRequests()) {
    const detail = getLeaveRequestDetail(summary.id)
    if (!detail || detail.status !== 'PENDING') continue
    // One group approver approval/rejection finalizes — no further reminders.
    if (hasFinalizingApproverAction(detail)) continue
    const waiting = detail.approvers.filter(
      (row) => row.role === 'approver' && row.status === 'no_action',
    )
    if (waiting.length === 0) continue
    requestCount += 1
    for (const row of waiting) pendingApproverIds.add(row.id)
  }

  return { approverCount: pendingApproverIds.size, requestCount }
}

const assignedGroupApprovers = (
  actor: { id: string; name: string },
  actionDate: string | null,
  othersNoAction = true,
) => [
  approverRow(actor, actionDate ? 'approved' : 'no_action', actionDate),
  ...(othersNoAction
    ? [APPROVER_2, APPROVER_3, APPROVER_4]
        .filter((p) => p.id !== actor.id)
        .map((p) => approverRow(p, 'no_action'))
    : []),
]

const LEAVE_REQUEST_DETAILS: Record<string, LeaveRequestDetail> = {
  'emp-1': detailFromSummary(EMPLOYEE_OWN_REQUESTS[0], {
    reason: 'Family trip',
    approvalsCompleted: 1,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'completed' },
    ],
    attachmentNote: null,
    approvers: [
      approverRow(JORDAN, 'approved', 'Jun 16, 2026, 10:00 AM'),
      approverRow(APPROVER_2, 'no_action'),
      approverRow(APPROVER_3, 'no_action'),
      approverRow(APPROVER_4, 'no_action'),
    ],
  }),
  'emp-2': detailFromSummary(EMPLOYEE_OWN_REQUESTS[1], {
    reason: 'Not feeling well after the fact — convertible VL',
    approvalsCompleted: 1,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'completed' },
    ],
    attachmentNote: null,
    approvers: [
      approverRow(JORDAN, 'approved', 'Jul 8, 2026, 11:00 AM'),
      approverRow(APPROVER_2, 'no_action'),
      approverRow(APPROVER_3, 'no_action'),
      approverRow(APPROVER_4, 'no_action'),
    ],
  }),
  'emp-3': detailFromSummary(EMPLOYEE_OWN_REQUESTS[2], {
    reason: 'Medical appointment',
    approvalsCompleted: 1,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'completed' },
    ],
    attachmentNote: 'Medical certificate uploaded.',
    attachmentFileName: 'medcert.png, rx.png',
    approvers: [
      approverRow(JORDAN, 'approved', 'Jun 20, 2026, 9:30 AM'),
      approverRow(APPROVER_2, 'no_action'),
      approverRow(APPROVER_3, 'no_action'),
      approverRow(APPROVER_4, 'no_action'),
    ],
  }),
  'emp-4': detailFromSummary(EMPLOYEE_OWN_REQUESTS[3], {
    reason: 'Long weekend travel',
    approvalsCompleted: 0,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'pending' },
    ],
    attachmentNote: null,
    approvers: [
      approverRow(JORDAN, 'no_action'),
      approverRow(APPROVER_2, 'no_action'),
      approverRow(APPROVER_3, 'no_action'),
      approverRow(APPROVER_4, 'no_action'),
    ],
  }),
  'emp-5': detailFromSummary(EMPLOYEE_OWN_REQUESTS[4], {
    reason: 'Personal appointment',
    approvalsCompleted: 1,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'completed' },
    ],
    attachmentNote: null,
    approvers: [
      approverRow(APPROVER_2, 'approved', 'Jul 1, 2026, 11:20 AM'),
      approverRow(JORDAN, 'no_action'),
      approverRow(APPROVER_3, 'no_action'),
      approverRow(APPROVER_4, 'no_action'),
    ],
  }),
  'emp-6': detailFromSummary(EMPLOYEE_OWN_REQUESTS[5], {
    reason: 'Weekend getaway',
    approvalsCompleted: 1,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'completed' },
    ],
    attachmentNote: null,
    approvers: [
      approverRow(
        JORDAN,
        'rejected',
        'Jul 19, 2026, 9:15 AM',
        'Insufficient staffing coverage for the requested dates.',
      ),
      approverRow(APPROVER_2, 'no_action'),
      approverRow(APPROVER_3, 'no_action'),
      approverRow(APPROVER_4, 'no_action'),
    ],
  }),
  'apr-1': detailFromSummary(APPROVER_OWN_REQUESTS[0], {
    reason: 'Long weekend',
    approvalsCompleted: 0,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'pending' },
    ],
    attachmentNote: null,
    department: 'Solution',
    approvers: [
      approverRow(APPROVER_2, 'no_action'),
      approverRow(APPROVER_3, 'no_action'),
      approverRow(APPROVER_4, 'no_action'),
    ],
  }),
  'apr-2': detailFromSummary(APPROVER_OWN_REQUESTS[1], {
    reason: 'Pedia appointment / newborn care',
    approvalsCompleted: 1,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'completed' },
    ],
    attachmentFileName: 'Paternity_Form.pdf',
    attachmentNote: null,
    department: 'Solution',
    approvers: [
      approverRow(APPROVER_2, 'approved', 'Jun 3, 2026'),
      approverRow(APPROVER_3, 'no_action'),
      approverRow(APPROVER_4, 'no_action'),
      approverRow(ADMIN, 'approved', 'Jun 3, 2026', null, 'admin', 'Admin validation'),
    ],
  }),
  'apr-3': detailFromSummary(APPROVER_OWN_REQUESTS[2], {
    reason: 'Family emergency travel',
    approvalsCompleted: 1,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'completed' },
    ],
    attachmentNote: null,
    department: 'Solution',
    approvers: [
      approverRow(
        APPROVER_2,
        'rejected',
        'Jul 15, 2026, 2:40 PM',
        'Critical deliverable scheduled on the same day.',
      ),
      approverRow(APPROVER_3, 'no_action'),
      approverRow(APPROVER_4, 'no_action'),
    ],
  }),
  'adm-1': detailFromSummary(ADMIN_OWN_REQUESTS[0], {
    reason: 'Personal errands',
    approvalsCompleted: 0,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'pending' },
    ],
    attachmentNote: null,
    approvers: [
      approverRow(JORDAN, 'no_action'),
      approverRow(APPROVER_2, 'no_action'),
    ],
  }),
  'adm-2': detailFromSummary(ADMIN_OWN_REQUESTS[1], {
    reason: 'Home emergency',
    approvalsCompleted: 1,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'completed' },
    ],
    attachmentNote: null,
    approvers: [approverRow(JORDAN, 'approved', 'May 30, 2026, 2:00 PM')],
  }),
  'adm-3': detailFromSummary(ADMIN_OWN_REQUESTS[2], {
    reason: 'Short personal trip',
    approvalsCompleted: 1,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'completed' },
    ],
    attachmentNote: null,
    approvers: [
      approverRow(
        JORDAN,
        'rejected',
        'Jul 10, 2026, 11:05 AM',
        'Conflicting leadership offsite on those dates.',
      ),
    ],
  }),
  'org-cecile-1': detailFromSummary(OTHER_ORG_REQUESTS[0], {
    reason: 'Unexpected illness',
    department: 'Project',
    approvalsCompleted: 0,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Admin validation', status: 'pending' },
    ],
    attachmentNote: null,
    conversion: {
      originalLeaveType: 'Vacation Leave',
      originalDayType: 'Whole day',
      originalDateFiled: 'July 1, 2026',
      originalLeavePeriod: 'July 1, 2026',
      filedBy: 'Approver 2',
      originalReason: 'Unexpected illness',
      originalAttachment: null,
      requestedLeaveType: 'Sick Leave',
      conversionRequestDate: 'July 2, 2026',
      conversionReason: 'Acute respiratory infection',
      conversionAttachment: 'Medical_certificate.jpg',
    },
    approvers: [
      approverRow(
        APPROVER_2,
        'approved',
        'Jul 1, 2026',
        null,
        'approver',
        'Leave approval',
      ),
      approverRow(
        APPROVER_3,
        'approved',
        'Jul 1, 2026',
        null,
        'approver',
        'Leave approval',
      ),
      approverRow(APPROVER_4, 'no_action', null, null, 'approver', 'Leave approval'),
      approverRow(
        JORDAN,
        'no_action',
        null,
        null,
        'approver',
        'Leave approval',
      ),
      approverRow(
        ADMIN,
        'no_action',
        null,
        null,
        'admin',
        'Admin validation',
      ),
    ],
  }),
  'org-melissa-1': detailFromSummary(OTHER_ORG_REQUESTS[1], {
    reason: 'Maternity leave',
    department: 'Project',
    approvalsCompleted: 0,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Admin validation', status: 'pending' },
    ],
    attachmentFileName: 'Maternity_docs.pdf',
    attachmentNote: null,
    conversion: null,
    approvers: [
      approverRow(
        JORDAN,
        'approved',
        'Jun 23, 2026',
        null,
        'approver',
        'Leave approval',
      ),
      approverRow(
        ADMIN,
        'no_action',
        null,
        null,
        'admin',
        'Admin validation',
      ),
    ],
  }),
  'org-paul-1': detailFromSummary(OTHER_ORG_REQUESTS[2], {
    reason: 'Pedia appointment',
    department: 'Project',
    approvalsCompleted: 1,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'completed' },
      { id: 'r2', label: 'Admin validation', status: 'completed' },
    ],
    attachmentFileName: 'Paternity_Form.pdf',
    attachmentNote: null,
    approvers: [
      approverRow(ADMIN, 'approved', 'June 3, 2026', null, 'admin'),
      approverRow(JORDAN, 'no_action'),
      approverRow(APPROVER_2, 'no_action'),
    ],
  }),
  'org-sam-1': detailFromSummary(OTHER_ORG_REQUESTS[3], {
    reason: 'Family event',
    approvalsCompleted: 0,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'pending' },
    ],
    attachmentNote: null,
    approvers: [
      approverRow(JORDAN, 'no_action'),
      approverRow(APPROVER_2, 'no_action'),
      approverRow(APPROVER_3, 'no_action'),
      approverRow(APPROVER_4, 'no_action'),
    ],
  }),
  'org-taylor-1': detailFromSummary(OTHER_ORG_REQUESTS[4], {
    reason: 'Urgent home repair',
    department: 'IT',
    approvalsCompleted: 1,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'completed' },
    ],
    attachmentNote: null,
    approvers: [
      approverRow(JORDAN, 'approved', 'Jul 10, 2026, 4:00 PM'),
      approverRow(APPROVER_2, 'no_action'),
    ],
  }),
  'org-sally-1': detailFromSummary(OTHER_ORG_REQUESTS[5], {
    reason: 'Personal day',
    approvalsCompleted: 1,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'completed' },
    ],
    attachmentNote: null,
    approvers: assignedGroupApprovers(JORDAN, 'Jul 6, 2026, 3:00 PM'),
  }),
  'org-emman-1': detailFromSummary(OTHER_ORG_REQUESTS[6], {
    reason: 'Out of town',
    approvalsCompleted: 1,
    approvalsRequired: 1,
    requirements: [
      { id: 'r1', label: 'Assigned group approver', status: 'completed' },
    ],
    attachmentNote: null,
    approvers: assignedGroupApprovers(APPROVER_2, 'Jul 7, 2026, 1:15 PM'),
  }),
}

export function getLeaveRequestDetail(
  requestId: string | undefined,
): LeaveRequestDetail | null {
  if (!requestId || !MOCK_DATA_ENABLED) return null
  const base = LEAVE_REQUEST_DETAILS[requestId]
  if (!base) return null
  const submission = conversionSubmissions[requestId]
  if (!submission) return base
  return applyConversionSubmission(base, submission)
}
