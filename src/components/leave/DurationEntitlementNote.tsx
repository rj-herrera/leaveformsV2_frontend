import { Info } from 'lucide-react'

type DurationEntitlementNoteProps = {
  className?: string
}

/** Informational hint under Duration for ML / PL / SPL (entitlement-derived ranges). */
export function DurationEntitlementNote({
  className = '',
}: DurationEntitlementNoteProps) {
  return (
    <p
      className={`mt-1 flex items-start gap-1.5 text-small text-text-gray ${className}`}
      role="note"
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>
        Duration is automatically calculated based on the applicable leave
        entitlement.
      </span>
    </p>
  )
}
