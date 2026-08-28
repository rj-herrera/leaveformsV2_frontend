/** Format API decimal strings (e.g. `"12.00"`) for balance cards. */
function formatBalanceDays(value: string | undefined): string {
  if (value == null) return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return String(Number.parseFloat(n.toFixed(2)))
}

function hasReservedCredits(value: string | undefined): boolean {
  if (value == null) return false
  const n = Number(value)
  return !Number.isNaN(n) && n > 0
}

type ReservedCreditsSectionProps = {
  reserved: string | undefined
}

export function ReservedCreditsSection({ reserved }: ReservedCreditsSectionProps) {
  if (!hasReservedCredits(reserved)) return null

  const formatted = formatBalanceDays(reserved)

  return (
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
        <p className="text-body font-semibold text-text-black">
          {formatted} {formatted === '1' ? 'day' : 'days'}
        </p>
      </div>
    </div>
  )
}
