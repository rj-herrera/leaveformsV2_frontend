/**
 * Mock data feature flag.
 *
 * - `false`: pages show skeleton UI; getters return empty data.
 * - `true`: seeded mock data is used; pass `isLoading` so skeletons
 *   only appear while fetching.
 *
 * Phase 1 API foundation is ready (`src/api/*` + `src/hooks/api/*`).
 * Prefer page → hook → `api/*` when wiring a screen. Keep mocks only for
 * modules with no backend yet (activity log, team calendar, most admin
 * reports/distributions). Flip pages off mocks incrementally in Phase 2+.
 */
export const MOCK_DATA_ENABLED = true

/** Prefer this helper in pages so loading skeletons stay consistent. */
export function shouldShowDataSkeleton(isLoading = false): boolean {
  return !MOCK_DATA_ENABLED || isLoading
}
