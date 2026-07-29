/**
 * One-off smoke verification for Administrative Log mock wiring.
 * Run: npx tsx scripts/verify-admin-log.ts
 */
import {
  getAdminLogEntries,
  filterAdminLogEntries,
  getAdminLogGroups,
  getAdminLogLeaveTypes,
} from '../src/mocks/adminLog.ts'
import {
  applyBalanceAdjustment,
  getContractualCandidates,
  setContractualDistributionDraft,
  applyContractualDistribution,
  getContractualDistributionDraft,
} from '../src/mocks/leaveBalances.ts'

const before = getAdminLogEntries()
console.log('SEED_COUNT', before.length)
if (before.length < 8) {
  throw new Error('Expected at least 8 seeded admin log rows')
}

const byGroup = filterAdminLogEntries(before, { group: 'SYS' })
console.log('FILTER_GROUP_SYS', byGroup.length)
if (byGroup.length === 0) throw new Error('Group SYS filter returned no rows')

const byMonth = filterAdminLogEntries(before, { monthYear: '2026-06' })
console.log('FILTER_MONTH_2026-06', byMonth.length)
if (byMonth.length === 0) throw new Error('Month 2026-06 filter returned no rows')

const bySearch = filterAdminLogEntries(before, { search: '801' })
console.log('FILTER_SEARCH_801', bySearch.length)
if (bySearch.length === 0) throw new Error('Search 801 returned no rows')

const byLeave = filterAdminLogEntries(before, { leaveType: 'Vacation Leave' })
console.log('FILTER_LEAVE_VL', byLeave.length)
if (byLeave.length === 0) {
  throw new Error('Leave type Vacation Leave returned no rows')
}

console.log('GROUPS', getAdminLogGroups().join('|'))
console.log('LEAVE_TYPES', getAdminLogLeaveTypes().join('|'))

const recorded = applyBalanceAdjustment('user-employee', {
  leaveTypeKey: 'vl',
  direction: 'add',
  amount: 1,
  effectiveDate: '2026-07-29',
  reasonCategory: 'system_fix',
  reason: 'Verify admin log wiring',
  performedBy: 'Casey Admin',
})
if (!recorded) throw new Error('applyBalanceAdjustment returned null')

const afterAdjust = getAdminLogEntries()
console.log('AFTER_ADJUST_COUNT', afterAdjust.length)
if (afterAdjust.length !== before.length + 1) {
  throw new Error('Expected one new admin log entry after adjust')
}

const newestAdjust = afterAdjust[0]
if (newestAdjust.eventType !== 'BALANCE_ADJUSTMENT') {
  throw new Error('Newest entry is not BALANCE_ADJUSTMENT')
}
if (newestAdjust.activity !== 'Leave credits added') {
  throw new Error('Unexpected activity label')
}
if (newestAdjust.targetEmployeeName !== 'Alex Employee') {
  throw new Error('Unexpected employee')
}
if (!newestAdjust.balanceImpact) throw new Error('Missing balanceImpact')
if (!newestAdjust.employeeNumber || !newestAdjust.groupLabel) {
  throw new Error('Missing employeeNumber/groupLabel')
}
console.log(
  'NEWEST_ADJUST',
  newestAdjust.activity,
  newestAdjust.balanceImpact,
  newestAdjust.employeeNumber,
  newestAdjust.groupLabel,
)

const contractual = getContractualCandidates()[0]
if (!contractual) throw new Error('No contractual candidates available')

setContractualDistributionDraft({
  selectedEmployeeIds: [contractual.id],
  assignmentsByEmployeeId: {
    [contractual.id]: [{ leaveTypeKey: 'vl', amount: 1 }],
  },
  groupFilter: 'ALL',
  effectiveDate: '2026-07-29',
})

const draft = getContractualDistributionDraft()
if (!draft) throw new Error('Contractual draft missing')

const beforeContractual = getAdminLogEntries().length
applyContractualDistribution(draft, {
  remarks: 'Verify contractual admin log',
  performedBy: 'Casey Admin',
})
const afterContractual = getAdminLogEntries()
console.log('AFTER_CONTRACTUAL_COUNT', afterContractual.length)
if (afterContractual.length < beforeContractual + 1) {
  throw new Error('Expected admin log entry after contractual distribution')
}

const newestContractual = afterContractual[0]
if (newestContractual.eventType !== 'CONTRACTUAL_DISTRIBUTION') {
  throw new Error('Newest entry is not CONTRACTUAL_DISTRIBUTION')
}
if (newestContractual.activity !== 'Leave Credit Distributed') {
  throw new Error('Unexpected contractual activity label')
}
console.log(
  'NEWEST_CONTRACTUAL',
  newestContractual.activity,
  newestContractual.targetEmployeeName,
  newestContractual.balanceImpact,
)

console.log('VERIFY_OK')
