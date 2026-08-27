import useSWR from 'swr'
import {
  listAdminActivities,
  type ListAdminActivitiesParams,
} from '../../api/adminActivities'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/adminActivities` for GET /admin/activities. */
export function useAdminActivities(params?: ListAdminActivitiesParams) {
  return useSWR(
    swrKeys.adminActivities(params),
    () => listAdminActivities(params),
    { keepPreviousData: true },
  )
}
