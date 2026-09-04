/**
 * Fallback mock work calendar when GET /holidays is not available.
 * Leave filing pages prefer `useNonWorkingHolidayDates()` (API).
 * Non-working holidays are excluded from working-day leave counts (e.g. Paternity).
 */
import { MOCK_DATA_ENABLED } from './config'

/** ISO dates (YYYY-MM-DD) treated as non-working holidays. */
const NON_WORKING_HOLIDAYS_2026: readonly string[] = [
  '2026-01-01', // New Year's Day
  '2026-04-02', // Maundy Thursday
  '2026-04-03', // Good Friday
  '2026-04-09', // Araw ng Kagitingan
  '2026-05-01', // Labor Day
  '2026-06-12', // Independence Day
  '2026-08-21', // Ninoy Aquino Day
  '2026-08-31', // National Heroes Day
  '2026-11-30', // Bonifacio Day
  '2026-12-25', // Christmas Day
  '2026-12-30', // Rizal Day
]

const NON_WORKING_HOLIDAYS = new Set<string>(
  MOCK_DATA_ENABLED ? NON_WORKING_HOLIDAYS_2026 : [],
)

export function isNonWorkingHoliday(iso: string): boolean {
  return NON_WORKING_HOLIDAYS.has(iso)
}
