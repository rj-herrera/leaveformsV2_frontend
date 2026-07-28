import type { LucideIcon } from 'lucide-react'

type LeaveTypeIconBadgeProps = {
  icon: LucideIcon
  iconBgClass: string
}

export function LeaveTypeIconBadge({ icon: Icon, iconBgClass }: LeaveTypeIconBadgeProps) {
  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-md text-white ${iconBgClass}`}
    >
      <Icon className="size-4" aria-hidden="true" />
    </span>
  )
}
