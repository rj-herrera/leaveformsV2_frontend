import useSWR from 'swr'
import {
  listActivities,
  type ListActivitiesParams,
} from '../../api/activities'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/activities` for GET /activities. */
export function useActivities(params?: ListActivitiesParams) {
  return useSWR(swrKeys.activities(params), () => listActivities(params), {
    keepPreviousData: true,
  })
}
