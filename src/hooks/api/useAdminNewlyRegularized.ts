import useSWR from 'swr'
import {
  listAdminNewlyRegularized,
  type ListAdminNewlyRegularizedParams,
} from '../../api/adminNewlyRegularized'
import { swrKeys } from './swrKeys'

/**
 * Page → hook → `api/adminNewlyRegularized` for GET /admin/newly-regularized.
 * Pass `null` to skip (e.g. missing draft on review).
 */
export function useAdminNewlyRegularized(
  params: ListAdminNewlyRegularizedParams | null,
) {
  return useSWR(
    params == null ? null : swrKeys.adminNewlyRegularized(params),
    params == null ? null : () => listAdminNewlyRegularized(params),
    { keepPreviousData: true },
  )
}
