import { type LucideIcon } from 'lucide-react'
import { LeaveTypeIconBadge } from './LeaveTypeIconBadge'
import { PageBackLink } from './PageBackLink'
import { INFO_FIELD_GRID_CLASS } from './tableStyles'

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
}: {
  label: string
  icon: LucideIcon
  iconBgClass: string
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
    </article>
  )
}

function LoadingInfoRow({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-small text-text-gray">{label}</dt>
      <dd>
        <Skeleton className="h-4 w-28" />
      </dd>
    </div>
  )
}

function LoadingInfoFieldGrid({
  labels,
  className,
}: {
  labels: string[]
  className?: string
}) {
  return (
    <dl className={className ?? `mt-4 ${INFO_FIELD_GRID_CLASS}`}>
      {labels.map((label) => (
        <LoadingInfoRow key={label} label={label} />
      ))}
    </dl>
  )
}

export type LeaveDetailInfoLayout =
  | 'employee'
  | 'review'
  | 'admin-view'
  | 'validate'

const EMPLOYEE_FIELD_LABELS = [
  'Employee No.',
  'Employee Name',
  'Department',
  'Group',
] as const

const LEAVE_INFO_LABELS = [
  'Date Filed',
  'Leave Period',
  'Duration',
  'Reason',
] as const

const LEAVE_SUMMARY_WITH_FILED_BY_LABELS = [
  'Date Filed',
  'Leave Period',
  'Filed By',
  'Duration',
  'Reason',
] as const

function LoadingInfoCard({
  title,
  labels,
  compact,
}: {
  title: string
  labels: readonly string[]
  compact?: boolean
}) {
  return (
    <article
      className={`flex flex-col rounded-lg border border-border bg-surface ${compact ? 'p-4' : 'p-5'}`}
    >
      <h2 className="text-h2 text-text-black">{title}</h2>
      <LoadingInfoFieldGrid
        labels={[...labels]}
        className={`${compact ? 'mt-3' : 'mt-4'} ${INFO_FIELD_GRID_CLASS}`}
      />
    </article>
  )
}

function LoadingTwoUpInfoCards({ showFiledBy }: { showFiledBy?: boolean }) {
  return (
    <section className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch">
      <LoadingInfoCard
        title="Employee Information"
        labels={EMPLOYEE_FIELD_LABELS}
        compact
      />
      <LoadingInfoCard
        title="Leave Request Summary"
        labels={
          showFiledBy ? LEAVE_SUMMARY_WITH_FILED_BY_LABELS : LEAVE_INFO_LABELS
        }
        compact
      />
    </section>
  )
}

function LoadingValidateInfoChrome() {
  return (
    <>
      <article className="shrink-0 rounded-lg border border-border bg-surface px-5 py-4">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border">
          {EMPLOYEE_FIELD_LABELS.map((label, index) => (
            <div key={label} className={index > 0 ? 'lg:pl-4' : undefined}>
              <LoadingInfoRow label={label} />
            </div>
          ))}
        </dl>
      </article>
      <LoadingInfoCard
        title="Leave Request Summary"
        labels={LEAVE_INFO_LABELS}
        compact
      />
    </>
  )
}

function LoadingInfoSections({ layout }: { layout: LeaveDetailInfoLayout }) {
  if (layout === 'review') {
    return <LoadingTwoUpInfoCards />
  }
  if (layout === 'admin-view') {
    return <LoadingTwoUpInfoCards showFiledBy />
  }
  if (layout === 'validate') {
    return <LoadingValidateInfoChrome />
  }
  return (
    <LoadingInfoCard title="Leave Information" labels={LEAVE_INFO_LABELS} />
  )
}

/**
 * Content-aware leave detail loading: back link + section headings stay;
 * only dynamic values pulse.
 */
export function LeaveDetailLoadingView({
  backTo,
  backLabel,
  infoLayout = 'employee',
}: {
  backTo: string
  backLabel: string
  infoLayout?: LeaveDetailInfoLayout
}) {
  const pageGap = infoLayout === 'employee' ? 'gap-4' : 'gap-3'

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden ${pageGap}`}
    >
      <PageBackLink to={backTo}>{backLabel}</PageBackLink>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>

      <LoadingInfoSections layout={infoLayout} />

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
      <PageBackLink to={backTo}>{backLabel}</PageBackLink>

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
