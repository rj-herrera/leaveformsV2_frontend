import type { LeaveLwopResource } from '../../api/types'
import { SICK_LEAVE_THEME, VACATION_LEAVE_THEME } from '../../constants/leaveTypeTheme'
import { formatDurationDays } from '../../utils/leaveDisplay'
import { Skeleton } from '../ui/Skeleton'

type LwopSummarySectionProps = {
  data: LeaveLwopResource | undefined
  isLoading: boolean
}

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

/**
 * Compact current-year VL/SL unpaid-day summary for the employee Dashboard.
 */
export function LwopSummarySection({ data, isLoading }: LwopSummarySectionProps) {
  const yearLabel = data?.year != null ? String(data.year) : null

  return (
    <section className="shrink-0 rounded-lg border border-border bg-white px-5 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-h2 text-text-black">Leave Without Pay</h2>
          <p className="text-small text-text-gray mt-0.5">
            {yearLabel
              ? `Accepted unpaid ${VACATION_LEAVE_THEME.label} and ${SICK_LEAVE_THEME.label} days in ${yearLabel}`
              : `Accepted unpaid ${VACATION_LEAVE_THEME.label} and ${SICK_LEAVE_THEME.label} days this year`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-4 sm:min-w-[22rem] sm:gap-8">
            <div>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-7 w-20" />
            </div>
            <div>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-7 w-20" />
            </div>
            <div>
              <Skeleton className="h-3 w-12" />
              <Skeleton className="mt-2 h-7 w-20" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:min-w-[22rem] sm:gap-8">
            <LwopStat label="Vacation" value={data?.vl_lwop_days} />
            <LwopStat label="Sick" value={data?.sl_lwop_days} />
            <LwopStat label="Total" value={data?.total_lwop_days} emphasize />
          </div>
        )}
      </div>
    </section>
  )
}
