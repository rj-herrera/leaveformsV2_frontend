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
    ] as const,

  pendingApprovals: ['approvals', 'pending'] as const,

  pendingConversions: ['conversions', 'pending'] as const,
}
