import useSWR from 'swr'
import {
  listAdminEmployees,
  type ListAdminEmployeesParams,
} from '../../api/adminEmployees'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/adminEmployees` for GET /admin/employees. */
export function useAdminEmployees(params?: ListAdminEmployeesParams) {
  return useSWR(swrKeys.adminEmployees(params), () => listAdminEmployees(params))
}
