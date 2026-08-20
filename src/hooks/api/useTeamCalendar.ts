import useSWR from 'swr'
import {
  listTeamCalendar,
  type ListTeamCalendarParams,
} from '../../api/calendar'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/calendar` for GET /team/calendar. */
export function useTeamCalendar(params: ListTeamCalendarParams | null) {
  return useSWR(
    params == null ? null : swrKeys.teamCalendar(params),
    params == null ? null : () => listTeamCalendar(params),
    { keepPreviousData: true },
  )
}
