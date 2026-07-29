/**
 * Smoke verification for Monthly Attendance Report mock wiring.
 * Run: npx tsx scripts/verify-monthly-attendance.ts
 */
import {
  buildAttendanceReport,
  getAttendanceDateColumns,
  getAttendanceEmployees,
  getAttendanceLeaveDays,
} from '../src/mocks/monthlyAttendance.ts'

const leaveDays = getAttendanceLeaveDays()
console.log('SEED_LEAVE_DAYS', leaveDays.length)
if (leaveDays.length < 20) {
  throw new Error('Expected at least 20 seeded attendance leave days')
}

const sysEmployees = getAttendanceEmployees('SYS')
console.log('SYS_EMPLOYEES', sysEmployees.length)
if (sysEmployees.length < 5) {
  throw new Error('Expected at least 5 SYS employees')
}

const julyMonthlyColumns = getAttendanceDateColumns(2026, 6, 'monthly')
console.log('JULY_MONTHLY_COLUMNS', julyMonthlyColumns.length)
if (julyMonthlyColumns.length !== 31) {
  throw new Error('July 2026 monthly cut-off should have 31 columns')
}

const julyFirstHalf = getAttendanceDateColumns(2026, 6, 'first-half')
if (julyFirstHalf.length !== 15) {
  throw new Error('July 2026 first-half cut-off should have 15 columns')
}

const julySecondHalf = getAttendanceDateColumns(2026, 6, 'second-half')
if (julySecondHalf.length !== 16) {
  throw new Error('July 2026 second-half cut-off should have 16 columns')
}

const nonWorking = julyMonthlyColumns.filter((column) => column.isNonWorking)
console.log('JULY_NON_WORKING_DAYS', nonWorking.length)
if (nonWorking.length < 8) {
  throw new Error('Expected weekends (and possibly holidays) in July columns')
}

const employeeIds = sysEmployees.map((employee) => employee.id)
const report = buildAttendanceReport({
  year: 2026,
  monthIndex: 6,
  cutOff: 'monthly',
  group: 'SYS',
  employeeIds,
  generatedAt: new Date('2026-07-29T15:00:00'),
})

if (!report) throw new Error('buildAttendanceReport returned null')
console.log('REPORT_ROWS', report.rows.length)
console.log('REPORT_VL_TOTAL', report.grandTotals.vl)
console.log('REPORT_SL_TOTAL', report.grandTotals.sl)
console.log('REPORT_OTHERS_TOTAL', report.grandTotals.others)
console.log('REPORT_LWOP_TOTAL', report.grandTotals.lwop)

if (report.rows.length !== employeeIds.length) {
  throw new Error('Report row count should match selected employees')
}

const alexRow = report.rows.find((row) => row.employee.id === 'user-employee')
if (!alexRow) throw new Error('Alex Employee row missing')
if (alexRow.totals.vl !== 3) {
  throw new Error(`Expected Alex VL total 3, got ${alexRow.totals.vl}`)
}
if (alexRow.totals.sl !== 0.5) {
  throw new Error(`Expected Alex SL total 0.5, got ${alexRow.totals.sl}`)
}

const jul20Cell = alexRow.cells.find((cell) => cell.date === '2026-07-20')
if (!jul20Cell || jul20Cell.display !== '1' || jul20Cell.category !== 'vl') {
  throw new Error('Alex Jul 20 cell should be full-day VL')
}

const jul10Cell = alexRow.cells.find((cell) => cell.date === '2026-07-10')
if (!jul10Cell || jul10Cell.display !== '0.5 (AM)') {
  throw new Error('Alex Jul 10 cell should be 0.5 (AM) SL')
}

const emptyReport = buildAttendanceReport({
  year: 2026,
  monthIndex: 6,
  cutOff: 'monthly',
  group: 'ALL',
  employeeIds: [],
})
if (emptyReport !== null) {
  throw new Error('Empty employee selection should return null')
}

console.log('OK monthly attendance mock')
