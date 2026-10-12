import useSWR from 'swr'
import {
  listAdminEmployees,
  type ListAdminEmployeesParams,
} from '../../api/adminEmployees'
import { swrKeys } from './swrKeys'

/**
 * Page → hook → `api/adminEmployees` for GET /admin/employees.
 * Pass `null` to skip the request.
 */
export function useAdminEmployees(params?: ListAdminEmployeesParams | null) {
  return useSWR(
    params === null ? null : swrKeys.adminEmployees(params),
    params === null ? null : () => listAdminEmployees(params),
  )
}
