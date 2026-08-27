import useSWR from 'swr'
import { listAdminDepartments } from '../../api/adminLeaves'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/adminLeaves` for GET /admin/departments. */
export function useAdminDepartments(enabled = true) {
  return useSWR(
    enabled ? swrKeys.adminDepartments : null,
    listAdminDepartments,
  )
}
