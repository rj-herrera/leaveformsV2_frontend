import type { LeaveLwopResource } from '../../api/types'
import {
  LONG_LEAVE_THEME,
  SICK_LEAVE_THEME,
  VACATION_LEAVE_THEME,
} from '../../constants/leaveTypeTheme'
import { formatDurationDays } from '../../utils/leaveDisplay'
import { Skeleton } from '../ui/Skeleton'

type LwopSummarySectionProps = {
  data: LeaveLwopResource | undefined
  isLoading: boolean
}

const STAT_GRID_CLASS =
  'grid grid-cols-2 gap-4 sm:min-w-[28rem] sm:grid-cols-4 sm:gap-6'

function LwopStat({
  label,
  value,
  emphasize,
}: {
  label: string
  value: string | undefined
  emphasize?: boolean
}) {
  return (
    <div className={emphasize ? 'text-status-rejected' : 'text-text-black'}>
      <p className="text-small font-semibold uppercase tracking-wide text-text-gray">
        {label}
      </p>
      <p
        className={`mt-1 text-h2 font-bold ${
          emphasize ? 'text-status-rejected' : 'text-text-black'
        }`}
      >
        {value == null ? '—' : formatDurationDays(value)}
      </p>
    </div>
  )
}

function LwopStatSkeleton() {
  return (
    <div>
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2 h-7 w-20" />
    </div>
  )
}

/**
 * Compact current-year VL/SL/LL unpaid-day summary for the employee Dashboard.
 */
export function LwopSummarySection({ data, isLoading }: LwopSummarySectionProps) {
  const yearLabel = data?.year != null ? String(data.year) : null
  const typeLabels = `${VACATION_LEAVE_THEME.label}, ${SICK_LEAVE_THEME.label}, and ${LONG_LEAVE_THEME.label}`

  return (
    <section className="shrink-0 rounded-lg border border-border bg-white px-5 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-h2 text-text-black">Leave Without Pay</h2>
          <p className="text-small text-text-gray mt-0.5">
            {yearLabel
              ? `Accepted unpaid ${typeLabels} days in ${yearLabel}`
              : `Accepted unpaid ${typeLabels} days this year`}
          </p>
        </div>

        {isLoading ? (
          <div className={STAT_GRID_CLASS}>
            <LwopStatSkeleton />
            <LwopStatSkeleton />
            <LwopStatSkeleton />
            <LwopStatSkeleton />
          </div>
        ) : (
          <div className={STAT_GRID_CLASS}>
            <LwopStat label="Vacation" value={data?.vl_lwop_days} />
            <LwopStat label="Sick" value={data?.sl_lwop_days} />
            <LwopStat label="Long" value={data?.ll_lwop_days} />
            <LwopStat label="Total" value={data?.total_lwop_days} emphasize />
          </div>
        )}
      </div>
    </section>
  )
}
