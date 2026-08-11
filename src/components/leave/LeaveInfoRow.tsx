export function LeaveInfoRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-small text-text-gray">{label}</dt>
      <dd className="text-body font-semibold text-text-black">{value}</dd>
    </div>
  )
}
