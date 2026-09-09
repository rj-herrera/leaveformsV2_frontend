import { TriangleAlert } from 'lucide-react'
import type { LeaveCreditsFilingNotice } from '../../utils/leaveFiling'

export type LeaveCreditsFilingAudience = 'self' | 'member'

type LeaveCreditsFilingBannerProps = {
  notice: LeaveCreditsFilingNotice
  leaveTypeLabel: string
  /**
   * Who the leave is for. Affects only the `mayBeLwop` body
   * (“your”/duration totals vs “the employee’s”); all other variants share one wording.
   */
  audience?: LeaveCreditsFilingAudience
  /** Formatted leave duration — used in the self `mayBeLwop` message. */
  durationLabel?: string
  /** Formatted remaining credits — used in the self `mayBeLwop` message. */
  remainingLabel?: string
  className?: string
}

const MAY_BE_LWOP_TITLE = 'Insufficient leave credits'

function mayBeLwopBody(
  audience: LeaveCreditsFilingAudience,
  durationLabel: string,
  remainingLabel: string,
): string {
  if (audience === 'member') {
    return 'This leave exceeds the employee’s remaining leave credits. Excess days may be treated as Leave Without Pay (LWOP).'
  }
  return `The requested duration (${durationLabel}) exceeds the remaining leave credits (${remainingLabel}). Excess days may be treated as Leave Without Pay (LWOP).`
}

function copyForNotice(
  notice: LeaveCreditsFilingNotice,
  leaveTypeLabel: string,
  audience: LeaveCreditsFilingAudience,
  durationLabel: string,
  remainingLabel: string,
): { title: string; body: string; role: 'alert' | 'status' } {
  switch (notice) {
    case 'noCredits':
      return {
        title: `No remaining ${leaveTypeLabel} credits`,
        body: `You cannot file ${leaveTypeLabel} because you have no remaining credits.`,
        role: 'alert',
      }
    case 'exceedsCredits':
      return {
        title: `Insufficient ${leaveTypeLabel} credits`,
        body: 'This leave exceeds your remaining credits. Shorten the leave or file the remaining days as Vacation Leave.',
        role: 'alert',
      }
    case 'fullLwop':
      return {
        title: `No remaining ${leaveTypeLabel} credits`,
        body: 'This request will be filed as Leave Without Pay (LWOP).',
        role: 'status',
      }
    case 'mayBeLwop':
      return {
        title: MAY_BE_LWOP_TITLE,
        body: mayBeLwopBody(audience, durationLabel, remainingLabel),
        role: 'status',
      }
  }
}

/**
 * Shared credit / LWOP notice shown while filing leave (self or on behalf).
 * Styling matches the existing pending warning banners on the file forms.
 */
export function LeaveCreditsFilingBanner({
  notice,
  leaveTypeLabel,
  audience = 'self',
  durationLabel = '0 days',
  remainingLabel = '0 days',
  className,
}: LeaveCreditsFilingBannerProps) {
  const { title, body, role } = copyForNotice(
    notice,
    leaveTypeLabel,
    audience,
    durationLabel,
    remainingLabel,
  )

  return (
    <div
      className={`flex items-start gap-3 rounded-md border-2 border-status-pending bg-status-pending/15 px-3 py-3 ${className ?? ''}`}
      role={role}
    >
      <TriangleAlert
        className="mt-0.5 size-5 shrink-0 text-status-pending"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-body font-semibold text-text-black">{title}</p>
        <p className="mt-1 text-small text-text-black">{body}</p>
      </div>
    </div>
  )
}
