import type { LeaveRequestDetail } from '../../mocks/leaveRequests'
import { INFO_FIELD_GRID_CLASS } from '../ui/tableStyles'
import { LeaveAttachmentRow } from './LeaveAttachmentRow'
import { LeaveInfoRow } from './LeaveInfoRow'

export function LeaveEmployeeSummaryPanels({
  detail,
  onPreview,
  showFiledBy = false,
}: {
  detail: LeaveRequestDetail
  onPreview: (value: string | null | undefined) => void
  showFiledBy?: boolean
}) {
  const attachmentValue = detail.conversion
    ? detail.conversion.conversionAttachment
    : detail.attachmentFileName

  return (
    <section className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch">
      <article className="flex flex-col rounded-lg border border-border bg-surface p-4">
        <h2 className="text-h2 text-text-black">Employee Information</h2>
        <dl className={`mt-3 ${INFO_FIELD_GRID_CLASS}`}>
          <LeaveInfoRow label="Employee No." value={detail.employeeNumber} />
          <LeaveInfoRow label="Employee Name" value={detail.requesterName} />
          <LeaveInfoRow label="Department" value={detail.department} />
          <LeaveInfoRow label="Group" value={detail.groupLabel} />
        </dl>
      </article>

      <article className="flex flex-col rounded-lg border border-border bg-surface p-4">
        <h2 className="text-h2 text-text-black">Leave Request Summary</h2>
        <dl className={`mt-3 ${INFO_FIELD_GRID_CLASS}`}>
          <LeaveInfoRow label="Date Filed" value={detail.dateFiled} />
          <LeaveInfoRow label="Leave Period" value={detail.leavePeriod} />
          {showFiledBy ? (
            <LeaveInfoRow label="Filed By" value={detail.requesterName} />
          ) : null}
          <LeaveInfoRow label="Duration" value={detail.duration} />
          <LeaveInfoRow label="Reason" value={detail.reason} />
          <LeaveAttachmentRow
            value={attachmentValue}
            alwaysShow={Boolean(detail.conversion)}
            onView={() => onPreview(attachmentValue)}
          />
        </dl>
      </article>
    </section>
  )
}
