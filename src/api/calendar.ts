import { apiGetList } from './axios-client'
import type { TeamCalendarEntry } from './types'

export type ListTeamCalendarParams = {
  from: string
  to: string
  code?: string
  group_id?: number
}

/** GET /team/calendar — approved team leaves overlapping `from`–`to`. */
export async function listTeamCalendar(
  params: ListTeamCalendarParams,
): Promise<TeamCalendarEntry[]> {
  const { data } = await apiGetList<TeamCalendarEntry>('/team/calendar', {
    params,
  })
  return data
}
