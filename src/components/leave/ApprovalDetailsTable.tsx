import { Button } from '../ui/Button'
import { TABLE_BODY_ROW_BORDER_CLASS } from '../ui/tableStyles'
import type { ApproverRow } from '../../types/approverRow'
import { ApproverStatusBadge } from './ApproverStatusBadge'

type YouBadgeVariant = 'primary' | 'muted'

const YOU_BADGE_CLASS: Record<YouBadgeVariant, string> = {
  primary:
    'rounded bg-primary px-1.5 py-0.5 text-header tracking-[0.08em] text-white uppercase',
  muted:
    'rounded bg-surface-muted px-1.5 py-0.5 text-header tracking-[0.08em] text-text-gray uppercase',
}

function purposeLabel(approver: ApproverRow): string {
  return (
    approver.purpose ??
    (approver.role === 'admin' ? 'Admin validation' : 'Leave approval')
  )
}

export function ApprovalDetailsTable({
  approvers,
  decisionSettled,
  showPurpose = false,
  currentUserId,
  youBadgeVariant = 'muted',
  canRemind,
  onRemind,
  headerClassName = 'shrink-0 border-b border-border px-5 py-3',
}: {
  approvers: ApproverRow[]
  decisionSettled: boolean
  showPurpose?: boolean
  currentUserId?: string
  youBadgeVariant?: YouBadgeVariant
  canRemind?: (approver: ApproverRow) => boolean
  onRemind?: (approver: ApproverRow) => void
  headerClassName?: string
}) {
  const showReminder = typeof onRemind === 'function'
  const minWidthClass = showReminder ? 'min-w-[720px]' : 'min-w-[640px]'

  return (
    <article className="flex min-h-0 flex-[0_1_auto] flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className={headerClassName}>
        <h2 className="text-h2 text-text-black">Approval Details</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        <table className={`w-full ${minWidthClass} text-left`}>
          <thead className="sticky top-0 z-10 bg-surface-muted">
            <tr className="border-b border-border bg-surface-muted text-small text-text-gray">
              <th className="px-5 py-3 font-bold uppercase tracking-wide">
                Approver
              </th>
              {showPurpose ? (
                <th className="px-5 py-3 font-bold uppercase tracking-wide">
                  Purpose
                </th>
              ) : null}
              <th className="px-5 py-3 font-bold uppercase tracking-wide">
                Status
              </th>
              <th className="px-5 py-3 font-bold uppercase tracking-wide">
                Action Date
              </th>
              <th className="px-5 py-3 font-bold uppercase tracking-wide">
                Remarks
              </th>
              {showReminder ? (
                <th className="px-5 py-3 text-center font-bold uppercase tracking-wide">
                  Action
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {approvers.map((approver) => {
              const isYou =
                currentUserId !== undefined && approver.id === currentUserId
              return (
                <tr
                  key={`${approver.id}-${approver.purpose ?? 'default'}`}
                  className={`${TABLE_BODY_ROW_BORDER_CLASS} text-body text-text-black`}
                >
                  <td className="px-5 py-3.5">
                    {currentUserId !== undefined ? (
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {approver.name}
                        {isYou ? (
                          <span className={YOU_BADGE_CLASS[youBadgeVariant]}>
                            You
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      approver.name
                    )}
                  </td>
                  {showPurpose ? (
                    <td className="px-5 py-3.5 text-text-gray">
                      {purposeLabel(approver)}
                    </td>
                  ) : null}
                  <td className="px-5 py-3.5">
                    <ApproverStatusBadge
                      status={approver.status}
                      decisionSettled={decisionSettled}
                    />
                  </td>
                  <td className="px-5 py-3.5 text-text-gray">
                    {approver.actionDate ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-text-gray">
                    {approver.remarks ?? '—'}
                  </td>
                  {showReminder ? (
                    <td className="px-5 py-3.5 text-center">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!canRemind?.(approver)}
                        onClick={() => onRemind?.(approver)}
                      >
                        Send Reminder
                      </Button>
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </article>
  )
}
