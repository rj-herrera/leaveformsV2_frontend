import type { ListMyLeavesParams } from '../../api/leaves'
import type { ListActivitiesParams } from '../../api/activities'
import type { ListAdminActivitiesParams } from '../../api/adminActivities'
import type { ListAdminAnnualEntitlementsParams } from '../../api/adminAnnualEntitlements'
import type { ListAdminBalancesParams } from '../../api/adminBalances'
import type { ListAdminEmployeesParams } from '../../api/adminEmployees'
import type { ListAdminLeavesParams } from '../../api/adminLeaves'
import type { ListEmployeesWithLwopParams } from '../../api/adminEmployeesWithLwop'
import type { ListMonthlyAttendanceParams } from '../../api/adminMonthlyAttendance'
import type { ListAdminContractualEntitlementsParams } from '../../api/adminContractualEntitlements'
import type { ListAdminNewlyRegularizedParams } from '../../api/adminNewlyRegularized'
import type { ListApprovalsParams } from '../../api/approvals'
import type { ListTeamCalendarParams } from '../../api/calendar'

/** Stable SWR cache keys — use these with `mutate(key)` after writes. */
export const swrKeys = {
  balances: (code?: string) =>
    code ? (['balances', code] as const) : (['balances'] as const),

  /** GET /balances?emp_id= — on-behalf remaining leave. */
  memberBalances: (empId: number, code?: string) =>
    ['balances', empId, code ?? null] as const,

  groupMembers: (groupId: number) => ['group-members', groupId] as const,

  /** GET /p4-members — president File Leave for Member picker. */
  p4Members: ['p4-members'] as const,

  leaves: (params?: ListMyLeavesParams) =>
    [
      'leaves',
      params?.status ?? null,
      params?.per_page ?? null,
      params?.page ?? null,
    ] as const,

  leave: (id: number) => ['leaves', id] as const,

  /** GET /leaves/lwop — current-year VL/SL/LL unpaid days. */
  leaveLwop: (params?: { year?: number; emp_id?: number }) =>
    ['leave-lwop', params?.year ?? null, params?.emp_id ?? null] as const,

  /** GET /leaves/quarter-usage — VL quarterly cap preview. */
  leaveQuarterUsage: (params: {
    start_date: string
    end_date: string
    day_type: string
    emp_id?: number | null
    code?: string | null
  }) =>
    [
      'leaves',
      'quarter-usage',
      params.start_date,
      params.end_date,
      params.day_type,
      params.emp_id ?? null,
      params.code ?? null,
    ] as const,

  activities: (params?: ListActivitiesParams) =>
    [
      'activities',
      params?.code ?? null,
      params?.activity_type ?? null,
      params?.sort ?? null,
      params?.per_page ?? null,
      params?.page ?? null,
    ] as const,

  adminActivities: (params?: ListAdminActivitiesParams) =>
    [
      'admin-activities',
      params?.q ?? null,
      params?.group_id ?? null,
      params?.code ?? null,
      params?.month ?? null,
      params?.sort ?? null,
      params?.per_page ?? null,
      params?.page ?? null,
    ] as const,

  pendingApprovals: ['approvals', 'pending'] as const,

  approvals: (params?: ListApprovalsParams) =>
    [
      'approvals',
      params?.q ?? null,
      params?.status ?? null,
      params?.code ?? null,
      params?.group_id ?? null,
      params?.sort ?? null,
      params?.per_page ?? null,
      params?.page ?? null,
    ] as const,

  holidays: (params: { from?: string; to?: string; year?: number }) =>
    [
      'holidays',
      params.from ?? null,
      params.to ?? null,
      params.year ?? null,
    ] as const,

  pendingConversions: ['conversions', 'pending'] as const,

  adminGroups: ['admin-groups'] as const,

  adminDepartments: ['admin-departments'] as const,

  adminReminders: ['admin-reminders'] as const,

  adminLeaves: (params?: ListAdminLeavesParams) =>
    [
      'admin-leaves',
      params?.q ?? null,
      params?.status ?? null,
      params?.code ?? null,
      params?.group_id ?? null,
      params?.sort ?? null,
      params?.per_page ?? null,
      params?.page ?? null,
    ] as const,

  adminBalances: (params?: ListAdminBalancesParams) =>
    [
      'admin-balances',
      params?.q ?? null,
      params?.department_id ?? null,
      params?.group_id ?? null,
      params?.employment_status ?? null,
      params?.sort ?? null,
      params?.per_page ?? null,
      params?.page ?? null,
    ] as const,

  adminAnnualEntitlements: (params?: ListAdminAnnualEntitlementsParams) =>
    [
      'admin-annual-entitlements',
      params?.year ?? null,
      params?.q ?? null,
      params?.group_id ?? null,
      typeof params?.emp_ids === 'string'
        ? params.emp_ids
        : params?.emp_ids?.join(',') ?? null,
      params?.sort ?? null,
      params?.per_page ?? null,
      params?.page ?? null,
    ] as const,

  adminNewlyRegularized: (params?: ListAdminNewlyRegularizedParams) =>
    [
      'admin-newly-regularized',
      params?.year ?? null,
      params?.q ?? null,
      params?.group_id ?? null,
      typeof params?.emp_ids === 'string'
        ? params.emp_ids
        : params?.emp_ids?.join(',') ?? null,
      params?.sort ?? null,
      params?.per_page ?? null,
      params?.page ?? null,
    ] as const,

  adminContractualEntitlements: (
    params?: ListAdminContractualEntitlementsParams,
  ) =>
    [
      'admin-contractual-entitlements',
      params?.q ?? null,
      params?.group_id ?? null,
      typeof params?.emp_ids === 'string'
        ? params.emp_ids
        : params?.emp_ids?.join(',') ?? null,
      params?.sort ?? null,
      params?.per_page ?? null,
      params?.page ?? null,
    ] as const,

  teamCalendar: (params: ListTeamCalendarParams) =>
    [
      'team-calendar',
      params.from,
      params.to,
      params.code ?? null,
      params.group_id ?? null,
    ] as const,

  adminEmployees: (params?: ListAdminEmployeesParams) =>
    ['admin-employees', params?.group_id ?? null] as const,

  adminMonthlyAttendance: (params: ListMonthlyAttendanceParams) =>
    [
      'admin-monthly-attendance',
      params.month,
      params.cut_off,
      params.group_id ?? null,
      params.emp_ids != null && params.emp_ids.length > 0
        ? params.emp_ids.join(',')
        : null,
    ] as const,

  adminLeaveMonetizationCandidates: (year: number) =>
    ['admin-leave-monetization-candidates', year] as const,

  adminEmployeesWithLwop: (params: ListEmployeesWithLwopParams) =>
    ['admin-employees-with-lwop', params.year, params.group_id ?? null] as const,
}

/**
 * True for list keys `['leaves', status, per_page, page]`.
 * False for detail keys `['leaves', id]` — important so mutate(undefined)
 * does not wipe an open leave detail cache.
 */
export function isLeaveListKey(key: unknown): boolean {
  return (
    Array.isArray(key) &&
    key[0] === 'leaves' &&
    key.length === 4
  )
}

/** True for paginated All Approvals keys `['approvals', q, status, code, group_id, sort, per_page, page]`. */
export function isApprovalsListKey(key: unknown): boolean {
  return (
    Array.isArray(key) &&
    key[0] === 'approvals' &&
    key.length === 8
  )
}

/** True for paginated admin leave list keys `['admin-leaves', ...]`. */
export function isAdminLeavesListKey(key: unknown): boolean {
  return (
    Array.isArray(key) &&
    key[0] === 'admin-leaves' &&
    key.length === 8
  )
}

/** True for paginated admin balances keys `['admin-balances', ...]`. */
export function isAdminBalancesListKey(key: unknown): boolean {
  return (
    Array.isArray(key) &&
    key[0] === 'admin-balances' &&
    key.length === 8
  )
}

/** True for admin annual entitlement list keys. */
export function isAdminAnnualEntitlementsListKey(key: unknown): boolean {
  return (
    Array.isArray(key) &&
    key[0] === 'admin-annual-entitlements' &&
    key.length === 8
  )
}

/** True for admin newly-regularized list keys. */
export function isAdminNewlyRegularizedListKey(key: unknown): boolean {
  return (
    Array.isArray(key) &&
    key[0] === 'admin-newly-regularized' &&
    key.length === 8
  )
}

/** True for admin contractual entitlement list keys. */
export function isAdminContractualEntitlementsListKey(key: unknown): boolean {
  return (
    Array.isArray(key) &&
    key[0] === 'admin-contractual-entitlements' &&
    key.length === 7
  )
}

/** True for paginated admin activities keys `['admin-activities', ...]`. */
export function isAdminActivitiesListKey(key: unknown): boolean {
  return (
    Array.isArray(key) &&
    key[0] === 'admin-activities' &&
    key.length === 8
  )
}
