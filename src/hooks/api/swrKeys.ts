import type { ListMyLeavesParams } from '../../api/leaves'
import type { ListActivitiesParams } from '../../api/activities'

/** Stable SWR cache keys — use these with `mutate(key)` after writes. */
export const swrKeys = {
  balances: (code?: string) =>
    code ? (['balances', code] as const) : (['balances'] as const),

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

  holidays: (params: { from?: string; to?: string; year?: number }) =>
    [
      'holidays',
      params.from ?? null,
      params.to ?? null,
      params.year ?? null,
    ] as const,

  pendingApprovals: ['approvals', 'pending'] as const,

  pendingConversions: ['conversions', 'pending'] as const,
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
