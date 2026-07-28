/**
 * Mock data feature flag.
 *
 * - `false`: pages show skeleton UI; getters return empty data.
 * - `true`: seeded mock data is used; pass `isLoading` so skeletons
 *   only appear while fetching.
 */
export const MOCK_DATA_ENABLED = true

/** Prefer this helper in pages so loading skeletons stay consistent. */
export function shouldShowDataSkeleton(isLoading = false): boolean {
  return !MOCK_DATA_ENABLED || isLoading
}
