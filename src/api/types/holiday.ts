/**
 * Holiday JsonResource (`HolidayResource`) from GET /holidays.
 * `date` is a calendar `YYYY-MM-DD` (no timezone).
 */
export type HolidayResource = {
  id: number
  date: string
  name: string
  holiday_type: number
  is_non_working: boolean
  location_id: number
  location: string
}
