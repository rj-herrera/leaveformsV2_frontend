import type { AdminBalanceTypeRow, AdminEmployeeBalanceRow } from '../api/types'
import type { LeaveBalanceKey } from '../mocks/leaveBalances'

/** Table columns map to these leave_type codes (excludes LL). */
export const ADMIN_BALANCE_COLUMN_CODES: Record<LeaveBalanceKey, string> = {
  vl: 'VL',
  sl: 'SL',
  el: 'EL',
  ml: 'ML',
  pl: 'PL',
  ptb: 'PTB',
}

function findBalanceRow(
  balances: AdminBalanceTypeRow[],
  balanceKey: LeaveBalanceKey,
): AdminBalanceTypeRow | undefined {
  const code = ADMIN_BALANCE_COLUMN_CODES[balanceKey]
  return balances.find((b) => b.code.toUpperCase() === code)
}

/**
 * Display `available` for a leave type. Inapplicable types (e.g. ML for male) → "—".
 */
export function formatAdminBalanceAvailable(
  balances: AdminBalanceTypeRow[],
  balanceKey: LeaveBalanceKey,
): string {
  const row = findBalanceRow(balances, balanceKey)
  if (!row || !row.applicable) return '—'
  return formatAvailableNumber(row.available)
}

/** Numeric `available` for adjust preview; inapplicable → 0. */
export function adminBalanceAvailableNumber(
  row: AdminEmployeeBalanceRow,
  balanceKey: LeaveBalanceKey,
): number {
  const bal = findBalanceRow(row.balances, balanceKey)
  if (!bal || !bal.applicable) return 0
  const n = Number(bal.available)
  return Number.isFinite(n) ? n : 0
}

export function isAdminBalanceTypeApplicable(
  row: AdminEmployeeBalanceRow,
  balanceKey: LeaveBalanceKey,
): boolean {
  const bal = findBalanceRow(row.balances, balanceKey)
  return bal?.applicable === true
}

export function formatAvailableNumber(value: string | number): string {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return '—'
  return Number.isInteger(n)
    ? String(n)
    : String(Number.parseFloat(n.toFixed(2)))
}

/** Signed delta string for POST /admin/balances (`available_delta`). */
export function formatAvailableDelta(
  amount: number,
  direction: 'add' | 'deduct',
): string {
  const normalized = Number.isInteger(amount)
    ? String(amount)
    : String(Number.parseFloat(amount.toFixed(2)))
  return direction === 'add' ? normalized : `-${normalized}`
}
