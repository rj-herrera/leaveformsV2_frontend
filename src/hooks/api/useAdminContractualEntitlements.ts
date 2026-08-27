import useSWR from 'swr'
import {
  listAdminContractualEntitlements,
  type ListAdminContractualEntitlementsParams,
} from '../../api/adminContractualEntitlements'
import { swrKeys } from './swrKeys'

/**
 * Page → hook → `api/adminContractualEntitlements` for GET /admin/contractual-entitlements.
 * Pass `null` to skip (e.g. missing draft on review).
 */
export function useAdminContractualEntitlements(
  params: ListAdminContractualEntitlementsParams | null,
) {
  return useSWR(
    params == null ? null : swrKeys.adminContractualEntitlements(params),
    params == null ? null : () => listAdminContractualEntitlements(params),
    { keepPreviousData: true },
  )
}
