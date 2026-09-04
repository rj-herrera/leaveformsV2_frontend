/**
 * Mock data feature flag.
 *
 * - `false`: getters return empty data; pages still render chrome and
 *   show skeletons only in data regions.
 * - `true`: seeded mock data is used; pass `isLoading` so data-region
 *   skeletons only appear while fetching.
 *
 * Prefer page → hook → `api/*` when wiring a screen. After mutations, call
 * `mutate(swrKeys.…)` (or the hook's `mutate`) to refresh cache. Keep mocks
 * only for modules with no backend yet (remaining admin reports,
 * monetization). Flip pages off mocks as APIs land.
 */
export const MOCK_DATA_ENABLED = true

/**
 * Temporary UI preview: force data-region skeletons as if loading.
 * Set to `false` when you are done reviewing skeletons.
 */
export const FORCE_DATA_SKELETONS = false

/** Prefer this helper so data-region skeletons stay consistent. */
export function shouldShowDataSkeleton(isLoading = false): boolean {
  return FORCE_DATA_SKELETONS || !MOCK_DATA_ENABLED || isLoading
}
