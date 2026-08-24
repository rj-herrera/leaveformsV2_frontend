import type { ListMyLeavesParams } from '../../api/leaves'
import type { ListActivitiesParams } from '../../api/activities'
import type { ListAdminLeavesParams } from '../../api/adminLeaves'
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

  leaves: (params?: ListMyLeavesParams) =>
    [
      'leaves',
      params?.status ?? null,
      params?.per_page ?? null,
      params?.page ?? null,
    ] as const,

  leave: (id: number) => ['leaves', id] as const,

  activities: (params?: ListActivitiesParams) =>
    [
      'activities',
      params?.code ?? null,
      params?.activity_type ?? null,
      params?.sort ?? null,
      params?.per_page ?? null,
      params?.page ?? null,
    ] as const,

  pendingApprovals: ['approvals', 'pending'] as const,

  approvals: (params?: ListApprovalsParams) =>
    [
      'approvals',
      params?.status ?? null,
      params?.code ?? null,
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

  adminLeaves: (params?: ListAdminLeavesParams) =>
    [
      'admin-leaves',
      params?.status ?? null,
      params?.code ?? null,
      params?.group_id ?? null,
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

/** True for paginated All Approvals keys `['approvals', status, code, sort, per_page, page]`. */
export function isApprovalsListKey(key: unknown): boolean {
  return (
    Array.isArray(key) &&
    key[0] === 'approvals' &&
    key.length === 6
  )
}

/** True for paginated admin leave list keys `['admin-leaves', ...]`. */
export function isAdminLeavesListKey(key: unknown): boolean {
  return (
    Array.isArray(key) &&
    key[0] === 'admin-leaves' &&
    key.length === 7
  )
}
