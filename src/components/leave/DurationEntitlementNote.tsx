import { Info } from 'lucide-react'

type DurationEntitlementNoteProps = {
  className?: string
  message?: string
}

/** Informational hint under Duration for ML / PL, or a custom cap message. */
export function DurationEntitlementNote({
  className = '',
  message = 'Duration is automatically calculated based on the applicable leave entitlement.',
}: DurationEntitlementNoteProps) {
  return (
    <p
      className={`mt-1 flex items-start gap-1.5 text-small text-text-gray ${className}`}
      role="note"
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  )
}
