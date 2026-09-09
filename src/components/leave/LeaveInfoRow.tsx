export function LeaveInfoRow({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <dt className="text-small text-text-gray">{label}</dt>
      <dd className="mt-0.5 wrap-break-word text-body font-semibold text-text-black">
        {value}
      </dd>
    </div>
  )
}

/** SPL-only rows from GET /leaves/{id}. Hidden when both labels are empty. */
export function SpecialLeaveDetailRows({
  assignmentTypeLabel,
  specialLeaveReasonLabel,
}: {
  assignmentTypeLabel?: string | null
  specialLeaveReasonLabel?: string | null
}) {
  const assignment = assignmentTypeLabel?.trim() ?? ''
  const event = specialLeaveReasonLabel?.trim() ?? ''
  if (!assignment && !event) return null
  return (
    <>
      <LeaveInfoRow label="Assignment Type" value={assignment || '—'} />
      <LeaveInfoRow
        label="Qualifying Event / Relationship"
        value={event || '—'}
      />
    </>
  )
}
