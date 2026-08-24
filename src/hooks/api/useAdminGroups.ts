import useSWR from 'swr'
import { listAdminGroups } from '../../api/adminLeaves'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/adminLeaves` for GET /admin/groups. */
export function useAdminGroups(enabled = true) {
  return useSWR(enabled ? swrKeys.adminGroups : null, listAdminGroups)
}
