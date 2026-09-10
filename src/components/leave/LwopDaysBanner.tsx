import { Info } from 'lucide-react'
import type { LeaveLwopResource } from '../../api/types'
import {
  SICK_LEAVE_THEME,
  VACATION_LEAVE_THEME,
} from '../../constants/leaveTypeTheme'
import { formatDurationDays } from '../../utils/leaveDisplay'

type LwopDaysBannerProps = {
  data: LeaveLwopResource | undefined
  isLoading: boolean
}

function hasAccumulatedLwop(data: LeaveLwopResource | undefined): data is LeaveLwopResource {
  if (data == null) return false
  const total = Number(data.total_lwop_days)
  return !Number.isNaN(total) && total > 0
}

/**
 * Compact dashboard notice when the employee has accumulated LWOP days.
 * Hidden at 0 days; breakdown is available via the info tooltip.
 */
export function LwopDaysBanner({ data, isLoading }: LwopDaysBannerProps) {
  if (isLoading || !hasAccumulatedLwop(data)) return null

  const tooltipId = 'lwop-days-breakdown'

  return (
    <div
      className="flex shrink-0 items-center justify-between gap-3 rounded-lg border-2 border-yellow-500 bg-yellow-50 px-3.5 py-1.5"
      role="status"
    >
      <p className="min-w-0 text-body text-yellow-500">
        You have{' '}
        <span className="font-semibold text-yellow-600">
          {formatDurationDays(data.total_lwop_days)}
        </span>{' '}
        of Leave Without Pay (LWOP).
      </p>

      <div className="group relative shrink-0">
        <button
          type="button"
          className="inline-flex size-6 items-center justify-center rounded-full text-yellow-500 transition-colors hover:bg-yellow-500 hover:text-white"
          aria-label="Leave Without Pay breakdown"
          aria-describedby={tooltipId}
        >
          <Info className="size-4" aria-hidden="true" />
        </button>

        <div
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute top-full right-0 z-20 mt-1.5 w-52 rounded-md border border-border bg-white px-3 py-2.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <p className="text-small font-semibold text-text-black">LWOP breakdown</p>
          <dl className="mt-1.5 space-y-1 text-small text-text-gray">
            <div className="flex items-center justify-between gap-3">
              <dt>{VACATION_LEAVE_THEME.label}</dt>
              <dd className="font-medium text-text-black">
                {formatDurationDays(data.vl_lwop_days)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>{SICK_LEAVE_THEME.label}</dt>
              <dd className="font-medium text-text-black">
                {formatDurationDays(data.sl_lwop_days)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
