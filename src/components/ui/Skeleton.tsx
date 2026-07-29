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

export function BalanceCardSkeleton() {
  return (
    <article className="flex flex-col rounded-lg border border-border bg-white p-5">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="mt-5 flex flex-col items-center gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </article>
  )
}

export function DetailPageSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <Skeleton className="h-4 w-40" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-4 h-2 w-full rounded-full" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 rounded-lg border border-border bg-surface p-5">
        <Skeleton className="h-5 w-28" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function CalendarGridSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
      <div className="grid shrink-0 grid-cols-5 border-b border-border bg-surface-muted">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="border-r border-border px-2 py-2 last:border-r-0"
          >
            <Skeleton className="mx-auto h-3 w-8" />
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
