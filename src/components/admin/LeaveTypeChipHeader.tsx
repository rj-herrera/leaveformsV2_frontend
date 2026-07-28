import {
  LEAVE_BALANCE_CHIP_CLASS,
  LEAVE_BALANCE_SHORT,
  type LeaveBalanceKey,
} from '../../mocks/leaveBalances'

export function LeaveTypeChipHeader({
  balanceKey,
}: {
  balanceKey: LeaveBalanceKey
}) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-small font-semibold tracking-wide ${LEAVE_BALANCE_CHIP_CLASS[balanceKey]}`}
    >
      {LEAVE_BALANCE_SHORT[balanceKey]}
    </span>
  )
}
