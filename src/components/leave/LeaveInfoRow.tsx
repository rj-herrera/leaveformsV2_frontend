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
