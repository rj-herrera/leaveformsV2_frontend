import useSWR from 'swr'
import { getLeaveQuarterUsage } from '../../api/leaves'
import type { DayType } from '../../api/types'
import { swrKeys } from './swrKeys'

export type UseLeaveQuarterUsageParams = {
  /** When false, the request is skipped. */
  enabled?: boolean
  startDate: string
  endDate: string
  dayType: '' | DayType
  empId?: number | null
  code?: string | null
}

/**
 * GET /leaves/quarter-usage after VL dates are chosen.
 * Skips when disabled, non-VL, or start/end/day type are incomplete.
 */
export function useLeaveQuarterUsage(params: UseLeaveQuarterUsageParams) {
  const enabled = params.enabled !== false
  const code = (params.code ?? 'VL').toUpperCase()
  const dayType = params.dayType
  const ready =
    enabled &&
    code === 'VL' &&
    params.startDate !== '' &&
    params.endDate !== '' &&
    dayType !== '' &&
    params.endDate >= params.startDate

  return useSWR(
    ready
      ? swrKeys.leaveQuarterUsage({
          start_date: params.startDate,
          end_date: params.endDate,
          day_type: dayType,
          emp_id: params.empId ?? null,
          code,
        })
      : null,
    () =>
      getLeaveQuarterUsage({
        start_date: params.startDate,
        end_date: params.endDate,
        day_type: dayType as DayType,
        ...(params.empId != null ? { emp_id: params.empId } : {}),
        code,
      }),
  )
}
