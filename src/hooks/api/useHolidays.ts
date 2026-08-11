import { useMemo } from 'react'
import useSWR from 'swr'
import { listHolidays, type ListHolidaysParams } from '../../api/holidays'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/holidays` for GET /holidays. */
export function useHolidays(params: ListHolidaysParams) {
  return useSWR(swrKeys.holidays(params), () => listHolidays(params))
}

/**
 * Non-working holiday ISO dates for the date picker (current + next calendar year).
 * Returns empty collections until the first successful response (weekends still blocked locally).
 */
export function useNonWorkingHolidayDates(): {
  nonWorkingDates: ReadonlySet<string>
  /** `YYYY-MM-DD` → holiday display name (for picker tooltips). */
  holidayNames: ReadonlyMap<string, string>
  isLoading: boolean
} {
  const year = new Date().getFullYear()
  const current = useHolidays({ year })
  const next = useHolidays({ year: year + 1 })

  const { nonWorkingDates, holidayNames } = useMemo(() => {
    const dates = new Set<string>()
    const names = new Map<string, string>()
    for (const row of [...(current.data ?? []), ...(next.data ?? [])]) {
      if (!row.is_non_working) continue
      dates.add(row.date)
      const label = row.name.trim()
      if (label) names.set(row.date, label)
    }
    return { nonWorkingDates: dates, holidayNames: names }
  }, [current.data, next.data])

  return {
    nonWorkingDates,
    holidayNames,
    isLoading:
      (current.isLoading || next.isLoading) && nonWorkingDates.size === 0,
  }
}
