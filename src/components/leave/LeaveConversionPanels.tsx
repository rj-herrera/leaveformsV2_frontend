import type { LeaveConversionInfo } from '../../mocks/leaveRequests'
import { INFO_FIELD_GRID_CLASS } from '../ui/tableStyles'
import { LeaveAttachmentRow } from './LeaveAttachmentRow'
import { LeaveInfoRow } from './LeaveInfoRow'

const SPACING = {
  comfortable: {
    section: 'grid shrink-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch',
    article: 'flex flex-col rounded-lg border border-border bg-surface p-5',
    list: `mt-4 ${INFO_FIELD_GRID_CLASS}`,
  },
  compact: {
    section: 'grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch',
    article: 'flex flex-col rounded-lg border border-border bg-surface p-4',
    list: `mt-3 ${INFO_FIELD_GRID_CLASS}`,
  },
} as const

export function LeaveConversionPanels({
  conversion,
  onPreview,
  spacing = 'compact',
}: {
  conversion: LeaveConversionInfo
  onPreview: (value: string | null | undefined) => void
  spacing?: keyof typeof SPACING
}) {
  const styles = SPACING[spacing]

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
            value={conversion.originalAttachment}
            onView={() => onPreview(conversion.originalAttachment)}
          />
        </dl>
      </article>

      <article className={styles.article}>
        <h2 className="text-h2 text-text-black">Leave Conversion Request</h2>
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
            value={conversion.conversionAttachment}
            onView={() => onPreview(conversion.conversionAttachment)}
          />
        </dl>
      </article>
    </section>
  )
}
