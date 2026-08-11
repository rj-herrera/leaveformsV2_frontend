import { apiGetList } from './axios-client'
import type { HolidayResource } from './types'

export type ListHolidaysParams =
  | { from: string; to: string; year?: never }
  | { year: number; from?: never; to?: never }

/** GET /holidays — `from`+`to` or `year` (max range 400 days when using dates). */
export async function listHolidays(
  params: ListHolidaysParams,
): Promise<HolidayResource[]> {
  const { data } = await apiGetList<HolidayResource>('/holidays', { params })
  return data
}
