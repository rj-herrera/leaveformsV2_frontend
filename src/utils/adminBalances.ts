import type { AdminBalanceTypeRow, AdminEmployeeBalanceRow } from '../api/types'
import type { LeaveBalanceKey } from '../mocks/leaveBalances'

/**
 * Rolling credit types on admin Leave Balances + Adjust.
 * ML/PL are granted on submit (not a yearly pot); LL/SPL have no rolling balance.
 */
export const ADMIN_BALANCE_KEYS = ['vl', 'sl', 'el', 'ptb'] as const

export type AdminBalanceKey = (typeof ADMIN_BALANCE_KEYS)[number]

/** Identity columns + Action. Used with `ADMIN_BALANCE_KEYS` for table colSpan. */
export const ADMIN_BALANCE_FIXED_COLUMN_COUNT = 5

export const ADMIN_BALANCE_TABLE_COLUMN_COUNT =
  ADMIN_BALANCE_FIXED_COLUMN_COUNT + ADMIN_BALANCE_KEYS.length

/** Table / adjust codes for rolling balance types. */
export const ADMIN_BALANCE_COLUMN_CODES: Record<AdminBalanceKey, string> = {
  vl: 'VL',
  sl: 'SL',
  el: 'EL',
  ptb: 'PTB',
}

function findBalanceRow(
  balances: AdminBalanceTypeRow[],
  balanceKey: LeaveBalanceKey,
): AdminBalanceTypeRow | undefined {
  const code = balanceKey.toUpperCase()
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
  balanceKey: AdminBalanceKey,
): number {
  const bal = findBalanceRow(row.balances, balanceKey)
  if (!bal || !bal.applicable) return 0
  const n = Number(bal.available)
  return Number.isFinite(n) ? n : 0
}

export function isAdminBalanceTypeApplicable(
  row: AdminEmployeeBalanceRow,
  balanceKey: AdminBalanceKey,
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
