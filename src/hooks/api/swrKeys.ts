import type { ListMyLeavesParams } from '../../api/leaves'

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
