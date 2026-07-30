/**
 * Smoke verification for Leave Monetization Candidates mock wiring.
 * Run: npx tsx scripts/verify-monetization-candidates.ts
 */
import {
  buildMonetizationReport,
  computeExcess,
  filterMonetizationCandidates,
  getBalanceAsOf,
  getMonetizationAvailability,
  getMonetizationBalanceOverrides,
  getMonetizationPolicy,
  getReportOpenFrom,
  hasSlEligible,
  hasVlEligible,
  resolveEligibilityBasis,
  sumEligibleTotals,
} from '../src/mocks/monetizationCandidates.ts'

const policy = getMonetizationPolicy()
if (policy.vlRetainedDays !== 10 || policy.slRetainedDays !== 30) {
  throw new Error('Expected retained balances VL=10 SL=30')
}

const asOf2025 = getBalanceAsOf(2025)
const asOf2026 = getBalanceAsOf(2026)
if (asOf2025 !== '2025-11-30') {
  throw new Error(`Expected 2025 cut-off 2025-11-30, got ${asOf2025}`)
}
if (asOf2026 !== '2026-11-30') {
  throw new Error(`Expected 2026 cut-off 2026-11-30, got ${asOf2026}`)
}
if (getReportOpenFrom(2026) !== '2026-12-01') {
  throw new Error('Expected 2026 report open date 2026-12-01')
}

const locked2026 = getMonetizationAvailability(
  2026,
  new Date(2026, 6, 30), // Jul 30, 2026 — before Dec 1
)
if (locked2026.available) {
  throw new Error('2026 report should be locked before December 1, 2026')
}
if (!locked2026.message?.includes('December 1, 2026')) {
  throw new Error(`Unexpected lock message: ${locked2026.message}`)
}

const open2025 = getMonetizationAvailability(
  2025,
  new Date(2026, 6, 30),
)
if (!open2025.available) {
  throw new Error('2025 report should remain available after its open date')
}

const open2026 = getMonetizationAvailability(
  2026,
  new Date(2026, 11, 5), // Dec 5, 2026
)
if (!open2026.available) {
  throw new Error('2026 report should be available on Dec 5, 2026')
}

if (computeExcess(15, 10) !== 5) throw new Error('VL excess 15-10 should be 5')
if (computeExcess(8, 10) !== 0) throw new Error('VL excess below retained should be 0')
if (computeExcess(32, 30) !== 2) throw new Error('SL excess 32-30 should be 2')

if (resolveEligibilityBasis(5, 2) !== 'VL and SL') {
  throw new Error('Expected VL and SL basis')
}
if (resolveEligibilityBasis(5, 0) !== 'VL') throw new Error('Expected VL basis')
if (resolveEligibilityBasis(0, 2) !== 'SL') throw new Error('Expected SL basis')
if (resolveEligibilityBasis(0, 0) !== null) {
  throw new Error('Zero excesses should not be eligible')
}

const overrides = getMonetizationBalanceOverrides()
if (Object.keys(overrides).length < 8) {
  throw new Error('Expected at least 8 seeded balance overrides')
}

const blocked = buildMonetizationReport({
  conversionYear: 2026,
  today: new Date(2026, 6, 30),
})
if (blocked !== null) {
  throw new Error('buildMonetizationReport should return null when locked')
}

const report = buildMonetizationReport({
  conversionYear: 2026,
  generatedAt: new Date('2026-12-05T10:00:00'),
  today: new Date(2026, 11, 5),
})

if (!report) throw new Error('buildMonetizationReport returned null')
console.log('CANDIDATES', report.employeeCount)
console.log('BALANCE_CUTOFF', report.balanceAsOfLabel)
console.log('TOTAL_VL_EXCESS', report.grandTotals.vlExcess)
console.log('TOTAL_SL_EXCESS', report.grandTotals.slExcess)
console.log('TOTAL_ELIGIBLE', report.grandTotals.totalEligibleDays)

if (report.balanceAsOf !== '2026-11-30') {
  throw new Error(`Expected report cut-off 2026-11-30, got ${report.balanceAsOf}`)
}

if (report.employeeCount < 5) {
  throw new Error('Expected at least 5 eligible candidates with seed data')
}

if (
  report.candidates[0].totalEligibleDays <
  report.candidates[report.candidates.length - 1].totalEligibleDays
) {
  throw new Error('Candidates should be sorted by total eligible days desc')
}

const alex = report.candidates.find((row) => row.employeeId === 'user-employee')
if (!alex) throw new Error('Alex Employee missing from candidates')
if (alex.vlExcess !== 5 || alex.slExcess !== 2 || alex.totalEligibleDays !== 7) {
  throw new Error(
    `Alex expected VL excess 5, SL excess 2, total 7; got ${alex.vlExcess}/${alex.slExcess}/${alex.totalEligibleDays}`,
  )
}
if (alex.eligibilityBasis !== 'VL and SL') {
  throw new Error('Alex eligibility basis should be VL and SL')
}

const sally = report.candidates.find((row) => row.employeeId === 'user-sally')
if (!sally || sally.eligibilityBasis !== 'VL') {
  throw new Error('Sally should be VL-only eligible')
}
if (hasSlEligible(sally.eligibilityBasis)) {
  throw new Error('Sally should not have SL eligibility')
}

const cecile = report.candidates.find((row) => row.employeeId === 'user-cecile')
if (!cecile || cecile.eligibilityBasis !== 'SL') {
  throw new Error('Cecile should be SL-only eligible')
}
if (hasVlEligible(cecile.eligibilityBasis)) {
  throw new Error('Cecile should not have VL eligibility')
}

const eligibleOnlyTotals = sumEligibleTotals([sally, cecile])
if (eligibleOnlyTotals.vlBalance !== sally.vlBalance) {
  throw new Error('VL-only row should contribute VL balance only')
}
if (eligibleOnlyTotals.slBalance !== cecile.slBalance) {
  throw new Error('SL-only row should contribute SL balance only')
}
if (eligibleOnlyTotals.vlBalance === sally.vlBalance + cecile.vlBalance) {
  throw new Error('N/A VL side for Cecile must not inflate VL balance total')
}

if (report.candidates.some((row) => row.employeeId === 'user-newly-reg-1')) {
  throw new Error('Nina Gomez (10/30) should not be eligible')
}

const vlOnly = filterMonetizationCandidates(report.candidates, {
  eligibilityType: 'VL',
})
if (vlOnly.some((row) => row.eligibilityBasis === 'SL')) {
  throw new Error('VL filter should not include SL-only candidates')
}

const bothOnly = filterMonetizationCandidates(report.candidates, {
  eligibilityType: 'BOTH',
})
if (bothOnly.some((row) => row.eligibilityBasis !== 'VL and SL')) {
  throw new Error('BOTH filter should only include VL and SL candidates')
}

const searched = filterMonetizationCandidates(report.candidates, {
  search: '801',
})
if (searched.length !== 1 || searched[0].employeeId !== 'user-employee') {
  throw new Error('Search by employee number should find Alex only')
}

console.log('OK monetization candidates mock')
