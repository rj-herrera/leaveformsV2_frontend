/**
 * TODO(REPLACE): Leave Monetization Candidates — replace with API.
 *
 * Policy cut-off dates, report-open window, and retained-balance rules are
 * configurable here so the UI does not permanently hard-code them.
 */
import {
  getAdminLeaveBalanceRows,
  type LeaveBalanceEmployee,
} from './leaveBalances'
import { MOCK_DATA_ENABLED } from './config'

/** Eligibility type filter applied when building the report. */
export type MonetizationEligibilityType = 'ALL' | 'VL' | 'SL' | 'BOTH'

export type MonetizationEligibilityBasis = 'VL' | 'SL' | 'VL and SL'

export type MonetizationPolicy = {
  vlRetainedDays: number
  slRetainedDays: number
  /**
   * Optional overrides for balance cut-off (ISO YYYY-MM-DD) by conversion year.
   * Default when omitted: November 30 of the conversion year.
   */
  balanceAsOfByYear: Record<number, string>
  /**
   * Optional overrides for report-open date (ISO YYYY-MM-DD) by conversion year.
   * Default when omitted: December 1 of the conversion year.
   */
  reportOpenFromByYear: Record<number, string>
}

export type MonetizationAvailability = {
  available: boolean
  balanceAsOf: string
  balanceAsOfLabel: string
  reportOpenFrom: string
  reportOpenFromLabel: string
  /** Null when available; otherwise a short reason for the locked state. */
  message: string | null
}

export type MonetizationCandidate = {
  employeeId: string
  employeeNumber: string
  employeeName: string
  groupLabel: string
  vlBalance: number
  vlRetained: number
  vlExcess: number
  slBalance: number
  slRetained: number
  slExcess: number
  totalEligibleDays: number
  eligibilityBasis: MonetizationEligibilityBasis
}

export type MonetizationGrandTotals = {
  vlBalance: number
  vlExcess: number
  slBalance: number
  slExcess: number
  totalEligibleDays: number
}

export type MonetizationReport = {
  conversionYear: number
  balanceAsOf: string
  balanceAsOfLabel: string
  employeeCount: number
  generatedAt: Date
  candidates: MonetizationCandidate[]
  grandTotals: MonetizationGrandTotals
}

export const MONETIZATION_ELIGIBILITY_OPTIONS: {
  value: MonetizationEligibilityType
  label: string
}[] = [
  { value: 'ALL', label: 'All Eligible Employees' },
  { value: 'VL', label: 'Vacation Leave Excess' },
  { value: 'SL', label: 'Sick Leave Excess' },
  { value: 'BOTH', label: 'Both VL and SL Excess' },
]

/**
 * Configurable monetization policy.
 * Conversion Year Y → cut-off November 30, Y; report opens December 1, Y.
 */
const MONETIZATION_POLICY: MonetizationPolicy = {
  vlRetainedDays: 10,
  slRetainedDays: 30,
  balanceAsOfByYear: {
    2025: '2025-11-30',
    2026: '2026-11-30',
    2027: '2027-11-30',
  },
  reportOpenFromByYear: {
    2025: '2025-12-01',
    2026: '2026-12-01',
    2027: '2027-12-01',
  },
}

/**
 * Seed balances as of the monetization cut-off.
 * Overrides live leave-balance rows so the report is demoable without mutating
 * the main leave-balances mock. Missing ids fall back to live VL/SL.
 */
const BALANCES_AS_OF_SEED: Record<string, { vl: number; sl: number }> = {
  'user-employee': { vl: 15, sl: 32 },
  'user-sally': { vl: 18, sl: 22 },
  'user-cecile': { vl: 8, sl: 35 },
  'user-employee-2': { vl: 12, sl: 31 },
  'user-employee-3': { vl: 14, sl: 10 },
  'user-emman': { vl: 22, sl: 40 },
  'user-paul': { vl: 16, sl: 28 },
  'user-melissa': { vl: 5, sl: 33 },
  'user-newly-reg-1': { vl: 10, sl: 30 },
  'user-contract-1': { vl: 9, sl: 29 },
}

const EMPTY_TOTALS: MonetizationGrandTotals = {
  vlBalance: 0,
  vlExcess: 0,
  slBalance: 0,
  slExcess: 0,
  totalEligibleDays: 0,
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Local calendar YYYY-MM-DD for date comparisons (avoids timezone drift). */
export function toDateKey(date: Date): string {
  return toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

export function formatIsoDateLabel(isoDate: string): string {
  if (!isoDate) return 'Not configured'
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return isoDate
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getMonetizationPolicy(): MonetizationPolicy {
  return {
    ...MONETIZATION_POLICY,
    balanceAsOfByYear: { ...MONETIZATION_POLICY.balanceAsOfByYear },
    reportOpenFromByYear: { ...MONETIZATION_POLICY.reportOpenFromByYear },
  }
}

/** Balance cut-off for conversion year Y — defaults to November 30, Y. */
export function getBalanceAsOf(conversionYear: number): string {
  return (
    MONETIZATION_POLICY.balanceAsOfByYear[conversionYear] ??
    toIsoDate(conversionYear, 11, 30)
  )
}

/** Report-open date for conversion year Y — defaults to December 1, Y. */
export function getReportOpenFrom(conversionYear: number): string {
  return (
    MONETIZATION_POLICY.reportOpenFromByYear[conversionYear] ??
    toIsoDate(conversionYear, 12, 1)
  )
}

export const formatBalanceAsOfLabel = formatIsoDateLabel

export function getMonetizationAvailability(
  conversionYear: number,
  today: Date = new Date(),
): MonetizationAvailability {
  const balanceAsOf = getBalanceAsOf(conversionYear)
  const reportOpenFrom = getReportOpenFrom(conversionYear)
  const balanceAsOfLabel = formatIsoDateLabel(balanceAsOf)
  const reportOpenFromLabel = formatIsoDateLabel(reportOpenFrom)
  const available = toDateKey(today) >= reportOpenFrom

  return {
    available,
    balanceAsOf,
    balanceAsOfLabel,
    reportOpenFrom,
    reportOpenFromLabel,
    message: available
      ? null
      : `Available starting ${reportOpenFromLabel}.`,
  }
}

export function isMonetizationReportAvailable(
  conversionYear: number,
  today: Date = new Date(),
): boolean {
  return getMonetizationAvailability(conversionYear, today).available
}

export function hasVlEligible(basis: MonetizationEligibilityBasis): boolean {
  return basis === 'VL' || basis === 'VL and SL'
}

export function hasSlEligible(basis: MonetizationEligibilityBasis): boolean {
  return basis === 'SL' || basis === 'VL and SL'
}

/** Excess is never negative. */
export function computeExcess(balance: number, retained: number): number {
  return Math.max(0, balance - retained)
}

export function resolveEligibilityBasis(
  vlExcess: number,
  slExcess: number,
): MonetizationEligibilityBasis | null {
  const hasVl = vlExcess > 0
  const hasSl = slExcess > 0
  if (hasVl && hasSl) return 'VL and SL'
  if (hasVl) return 'VL'
  if (hasSl) return 'SL'
  return null
}

export function matchesEligibilityType(
  basis: MonetizationEligibilityBasis,
  type: MonetizationEligibilityType,
): boolean {
  if (type === 'ALL') return true
  if (type === 'VL') return basis === 'VL' || basis === 'VL and SL'
  if (type === 'SL') return basis === 'SL' || basis === 'VL and SL'
  return basis === 'VL and SL'
}

function resolveBalancesAsOf(
  employee: LeaveBalanceEmployee,
): { vl: number; sl: number } | null {
  const override = BALANCES_AS_OF_SEED[employee.id]
  if (override) return override

  const vl = employee.balances.vl
  const sl = employee.balances.sl
  if (vl == null || sl == null) return null
  return { vl, sl }
}

function toCandidate(
  employee: LeaveBalanceEmployee,
  policy: MonetizationPolicy,
): MonetizationCandidate | null {
  const balances = resolveBalancesAsOf(employee)
  if (!balances) return null

  const vlExcess = computeExcess(balances.vl, policy.vlRetainedDays)
  const slExcess = computeExcess(balances.sl, policy.slRetainedDays)
  const basis = resolveEligibilityBasis(vlExcess, slExcess)
  if (!basis) return null

  return {
    employeeId: employee.id,
    employeeNumber: employee.employeeNumber,
    employeeName: employee.name,
    groupLabel: employee.groupLabel,
    vlBalance: balances.vl,
    vlRetained: policy.vlRetainedDays,
    vlExcess,
    slBalance: balances.sl,
    slRetained: policy.slRetainedDays,
    slExcess,
    totalEligibleDays: vlExcess + slExcess,
    eligibilityBasis: basis,
  }
}

/** Sum only eligible leave sides so N/A columns do not inflate totals. */
export function sumEligibleTotals(
  candidates: MonetizationCandidate[],
): MonetizationGrandTotals {
  return candidates.reduce<MonetizationGrandTotals>((acc, row) => {
    const vl = hasVlEligible(row.eligibilityBasis)
    const sl = hasSlEligible(row.eligibilityBasis)
    return {
      vlBalance: acc.vlBalance + (vl ? row.vlBalance : 0),
      vlExcess: acc.vlExcess + (vl ? row.vlExcess : 0),
      slBalance: acc.slBalance + (sl ? row.slBalance : 0),
      slExcess: acc.slExcess + (sl ? row.slExcess : 0),
      totalEligibleDays: acc.totalEligibleDays + row.totalEligibleDays,
    }
  }, { ...EMPTY_TOTALS })
}

/**
 * Builds the monetization candidates report for a conversion year.
 * Returns null when the reporting period for that year is not yet available.
 * Pass `today` to override the availability check (tests / demos).
 */
export function buildMonetizationReport(params: {
  conversionYear: number
  generatedAt?: Date
  today?: Date
}): MonetizationReport | null {
  if (!MOCK_DATA_ENABLED) return null

  const today = params.today ?? params.generatedAt ?? new Date()
  const availability = getMonetizationAvailability(params.conversionYear, today)
  if (!availability.available) return null

  const policy = getMonetizationPolicy()
  const candidates = getAdminLeaveBalanceRows()
    .map((employee) => toCandidate(employee, policy))
    .filter((row): row is MonetizationCandidate => row !== null)
    .sort((a, b) => {
      if (b.totalEligibleDays !== a.totalEligibleDays) {
        return b.totalEligibleDays - a.totalEligibleDays
      }
      return a.employeeName.localeCompare(b.employeeName)
    })

  return {
    conversionYear: params.conversionYear,
    balanceAsOf: availability.balanceAsOf,
    balanceAsOfLabel: availability.balanceAsOfLabel,
    employeeCount: candidates.length,
    generatedAt: params.generatedAt ?? new Date(),
    candidates,
    grandTotals: sumEligibleTotals(candidates),
  }
}

/**
 * Client-side filter over an already-built report (does not regenerate).
 * Applies search and/or eligibility type to the displayed candidate list only.
 */
export function filterMonetizationCandidates(
  candidates: MonetizationCandidate[],
  filters: {
    search?: string
    eligibilityType?: MonetizationEligibilityType
  } = {},
): MonetizationCandidate[] {
  const query = (filters.search ?? '').trim().toLowerCase()
  const eligibilityType = filters.eligibilityType ?? 'ALL'

  return candidates.filter((row) => {
    const matchesSearch =
      query.length === 0 ||
      row.employeeName.toLowerCase().includes(query) ||
      row.employeeNumber.toLowerCase().includes(query)
    const matchesEligibility = matchesEligibilityType(
      row.eligibilityBasis,
      eligibilityType,
    )
    return matchesSearch && matchesEligibility
  })
}

/** Exposed for smoke tests / demos. */
export function getMonetizationBalanceOverrides(): Record<
  string,
  { vl: number; sl: number }
> {
  return { ...BALANCES_AS_OF_SEED }
}
