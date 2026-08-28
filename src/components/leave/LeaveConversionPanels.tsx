import { X } from 'lucide-react'
import type { LeaveConversionInfo } from '../../types/leaveConversionInfo'
import { StatusBadge } from '../ui/StatusBadge'
import { INFO_FIELD_GRID_CLASS } from '../ui/tableStyles'
import { mapConversionStatusToUi } from '../../utils/leaveDisplay'
import { LeaveAttachmentRow } from './LeaveAttachmentRow'
import { LeaveInfoRow } from './LeaveInfoRow'

const SPACING = {
  comfortable: {
    section:
      'grid min-w-0 shrink-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch',
    article:
      'flex min-w-0 flex-col rounded-lg border border-border bg-surface p-5',
    list: `mt-4 min-w-0 ${INFO_FIELD_GRID_CLASS}`,
    afterTitle: 'mt-4',
  },
  compact: {
    section:
      'grid min-w-0 shrink-0 grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch',
    article:
      'flex min-w-0 flex-col rounded-lg border border-border bg-surface p-4',
    list: `mt-3 min-w-0 ${INFO_FIELD_GRID_CLASS}`,
    afterTitle: 'mt-3',
  },
} as const

export function LeaveConversionPanels({
  conversion,
  onPreview,
  spacing = 'compact',
}: {
  conversion: LeaveConversionInfo
  onPreview: (kind: 'original' | 'conversion') => void
  spacing?: keyof typeof SPACING
}) {
  const styles = SPACING[spacing]
  const isRejected = conversion.status === 'rejected'

  return (
    <section className={styles.section}>
      <article className={styles.article}>
        <h2 className="text-h2 text-text-black">Original Leave Request</h2>
        <dl className={styles.list}>
          <LeaveInfoRow label="Leave Type" value={conversion.originalLeaveType} />
          <LeaveInfoRow label="Day Type" value={conversion.originalDayType} />
          <LeaveInfoRow label="Date Filed" value={conversion.originalDateFiled} />
          <LeaveInfoRow
            label="Actual Leave Period"
            value={conversion.originalLeavePeriod}
          />
          <LeaveInfoRow label="Filed By" value={conversion.filedBy} />
          <LeaveInfoRow label="Reason" value={conversion.originalReason} />
          <LeaveAttachmentRow
            fileCount={conversion.originalAttachmentCount}
            onView={() => onPreview('original')}
          />
        </dl>
      </article>

      <article className={styles.article}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-h2 text-text-black">Leave Conversion Request</h2>
          <StatusBadge status={mapConversionStatusToUi(conversion.status)} />
        </div>

        <dl className={styles.list}>
          <LeaveInfoRow
            label="Requested Leave Type"
            value={conversion.requestedLeaveType}
          />
          <LeaveInfoRow
            label="Date of Conversion Request"
            value={conversion.conversionRequestDate}
          />
          <LeaveInfoRow
            label="Conversion Reason"
            value={conversion.conversionReason}
          />
          <LeaveAttachmentRow
            fileCount={conversion.conversionAttachmentCount}
            alwaysShow
            onView={() => onPreview('conversion')}
          />
        </dl>

        {isRejected ? (
          <div className={`flex flex-col gap-4 ${styles.afterTitle}`}>
            <div
              className="flex min-w-0 items-start gap-3 rounded-lg border border-status-rejected/40 bg-status-rejected/10 px-2 py-2"
              role="status"
            >
              <span className="inline-flex size-4.5 shrink-0 items-center justify-center rounded-full bg-status-rejected">
                <X
                  className="block size-3 text-white"
                  strokeWidth={3}
                  aria-hidden="true"
                />
              </span>

              <div className="min-w-0 flex-1">
                <p className="wrap-break-word text-[13px] font-semibold text-status-rejected">
                  This leave remains recorded as {conversion.originalLeaveType}.
                </p>
              </div>
            </div>

            <dl className="grid min-w-0 grid-cols-3 gap-x-6 gap-y-3">
              <LeaveInfoRow
                label="Reviewed By"
                value={conversion.reviewedBy?.trim() || '—'}
              />
              <LeaveInfoRow
                label="Date Reviewed"
                value={conversion.reviewedAtLabel?.trim() || '—'}
              />
              <LeaveInfoRow
                label="Rejection Reason"
                value={conversion.rejectionReason?.trim() || '—'}
              />
            </dl>
          </div>
        ) : null}
        
      </article>
    </section>
  )
}
