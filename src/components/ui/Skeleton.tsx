import { Link } from 'react-router-dom'
import { ArrowLeft, type LucideIcon } from 'lucide-react'
import { LeaveTypeIconBadge } from './LeaveTypeIconBadge'

type SkeletonProps = {
  className?: string
}

/** Base pulse block — reuse for loading and (for now) empty-seed placeholders. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-muted ${className}`}
      aria-hidden="true"
    />
  )
}

export function TableBodySkeleton({
  rows = 6,
  cols = 5,
  rowClassName = 'h-[46px]',
}: {
  rows?: number
  cols?: number
  rowClassName?: string
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={`skeleton-row-${rowIndex}`} className={rowClassName}>
          {Array.from({ length: cols }).map((__, colIndex) => (
            <td key={`skeleton-cell-${rowIndex}-${colIndex}`} className="px-5">
              <Skeleton className="h-3.5 w-full max-w-[9rem]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/** Balance card chrome stays; only numeric values pulse. */
export function BalanceCardSkeleton({
  label,
  icon,
  iconBgClass,
  showReserved = false,
}: {
  label: string
  icon: LucideIcon
  iconBgClass: string
  showReserved?: boolean
}) {
  return (
    <article className="flex flex-col rounded-lg border border-border bg-white p-5">
      <div className="flex items-center gap-2.5">
        <LeaveTypeIconBadge icon={icon} iconBgClass={iconBgClass} />
        <h2 className="text-body font-semibold text-text-black">{label}</h2>
      </div>
      <div className="mt-5 flex flex-col items-center gap-2">
        <Skeleton className="h-10 w-16" />
        <p className="text-body text-text-gray">days available</p>
      </div>
      {showReserved ? (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-small font-semibold text-text-black">
                Reserved Credits
              </p>
              <p className="text-small text-text-gray mt-0.5">
                Subject for approval
              </p>
            </div>
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
      ) : null}
    </article>
  )
}

function LoadingInfoRow({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="text-body shrink-0 text-text-gray">{label}</dt>
      <dd className="min-w-0 sm:text-right">
        <Skeleton className="h-4 w-36 sm:ml-auto" />
      </dd>
    </div>
  )
}

/**
 * Content-aware leave detail loading: back link + section headings stay;
 * only dynamic values pulse.
 */
export function LeaveDetailLoadingView({
  backTo,
  backLabel,
}: {
  backTo: string
  backLabel: string
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <Link
        to={backTo}
        className="text-body inline-flex w-fit shrink-0 items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {backLabel}
      </Link>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>

      <article className="shrink-0 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-h2 text-text-black">Leave Information</h2>
        <dl className="mt-4 space-y-3">
          <LoadingInfoRow label="Date Filed" />
          <LoadingInfoRow label="Leave Period" />
          <LoadingInfoRow label="Duration" />
          <LoadingInfoRow label="Reason" />
        </dl>
      </article>

      <section className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface p-5">
        <h2 className="text-h2 text-text-black">Approval Details</h2>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5"
            >
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/** Form-page loading: static titles/labels; skeleton only for field values. */
export function FormPageLoadingView({
  backTo,
  backLabel,
  title,
  sections,
}: {
  backTo: string
  backLabel: string
  title: string
  sections: Array<{
    heading: string
    fields: Array<{ label: string; span?: 1 | 2 }>
  }>
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <Link
        to={backTo}
        className="text-body inline-flex w-fit shrink-0 items-center gap-1.5 text-text-gray transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {backLabel}
      </Link>

      <h1 className="shrink-0 text-h1 text-text-black">{title}</h1>

      {sections.map((section) => (
        <section
          key={section.heading}
          className="shrink-0 rounded-lg border border-border bg-surface p-5"
        >
          <h2 className="text-h2 text-text-black">{section.heading}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div
                key={field.label}
                className={field.span === 2 ? 'sm:col-span-2' : undefined}
              >
                <p className="text-small mb-1.5 font-medium text-text-black">
                  {field.label}
                </p>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

/** Calendar data cells only — weekday headers stay real. */
export function CalendarGridSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
      <div className="grid shrink-0 grid-cols-5 border-b border-border bg-surface-muted">
        {WEEKDAY_HEADERS.map((day) => (
          <div
            key={day}
            className="border-r border-border px-2 py-2 text-center last:border-r-0"
          >
            <span className="text-small font-medium text-text-gray">{day}</span>
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-4">
        {Array.from({ length: 4 }).map((_, weekIndex) => (
          <div
            key={weekIndex}
            className="grid min-h-0 grid-cols-5 border-b border-border last:border-b-0"
          >
            {Array.from({ length: 5 }).map((__, dayIndex) => (
              <div
                key={dayIndex}
                className="border-r border-border p-2 last:border-r-0"
              >
                <Skeleton className="mb-2 size-6 rounded-full" />
                <Skeleton className="mb-1 h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Side-panel list data only — panel title stays on the page. */
export function SidePanelListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="mt-3 space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </li>
      ))}
    </ul>
  )
}
