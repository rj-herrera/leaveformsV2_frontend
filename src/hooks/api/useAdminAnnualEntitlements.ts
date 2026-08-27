import useSWR from 'swr'
import {
  listAdminAnnualEntitlements,
  type ListAdminAnnualEntitlementsParams,
} from '../../api/adminAnnualEntitlements'
import { swrKeys } from './swrKeys'

/**
 * Page → hook → `api/adminAnnualEntitlements` for GET /admin/annual-entitlements.
 * Pass `null` to skip (e.g. missing draft on review).
 */
export function useAdminAnnualEntitlements(
  params: ListAdminAnnualEntitlementsParams | null,
) {
  return useSWR(
    params == null ? null : swrKeys.adminAnnualEntitlements(params),
    params == null ? null : () => listAdminAnnualEntitlements(params),
    { keepPreviousData: true },
  )
}
