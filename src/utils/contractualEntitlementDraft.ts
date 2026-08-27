const DRAFT_KEY = 'leaveforms.contractualEntitlementDraft'

/** Max credits per leave type (matches BE `leave.contractual_entitlement.max_per_type`). */
export const CONTRACTUAL_MAX_PER_TYPE = 15

export type ContractualRowAmounts = {
  vlToAdd: string
  slToAdd: string
}

export type ContractualEntitlementDraft = {
  empIds: number[]
  /** Keyed by emp id string. */
  amountsByEmpId: Record<string, ContractualRowAmounts>
  groupFilter: string
}

/** Passed via router state when navigating back from Review → Assign. */
export type ContractualAssignLocationState = {
  empIds: number[]
  amountsByEmpId: Record<string, ContractualRowAmounts>
  groupFilter: string
}

function sanitizeAmounts(
  raw: unknown,
): Record<string, ContractualRowAmounts> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, ContractualRowAmounts> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object') continue
    const row = value as Partial<ContractualRowAmounts>
    out[key] = {
      vlToAdd: typeof row.vlToAdd === 'string' ? row.vlToAdd : '',
      slToAdd: typeof row.slToAdd === 'string' ? row.slToAdd : '',
    }
  }
  return out
}

export function getContractualEntitlementDraft(): ContractualEntitlementDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ContractualEntitlementDraft>
    if (!Array.isArray(parsed.empIds) || parsed.empIds.length === 0) {
      return null
    }
    const empIds = parsed.empIds
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0)
    if (empIds.length === 0) return null
    return {
      empIds,
      amountsByEmpId: sanitizeAmounts(parsed.amountsByEmpId),
      groupFilter:
        typeof parsed.groupFilter === 'string' ? parsed.groupFilter : 'ALL',
    }
  } catch {
    return null
  }
}

export function setContractualEntitlementDraft(
  draft: ContractualEntitlementDraft,
): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

export function clearContractualEntitlementDraft(): void {
  sessionStorage.removeItem(DRAFT_KEY)
}

/**
 * Parse a typed credit amount. Must be &gt; 0, ≤ max, at most 2 decimals.
 * Returns null if invalid / empty.
 */
export function parseContractualAmount(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n <= 0 || n > CONTRACTUAL_MAX_PER_TYPE) {
    return null
  }
  return n
}

export function formatContractualAmountForApi(n: number): string {
  return Number.isInteger(n)
    ? String(n)
    : String(Number.parseFloat(n.toFixed(2)))
}

export function rowHasValidCredit(amounts: ContractualRowAmounts): boolean {
  return (
    parseContractualAmount(amounts.vlToAdd) != null ||
    parseContractualAmount(amounts.slToAdd) != null
  )
}

export function addAvailableAndGrant(
  available: string,
  grant: number | null,
): number {
  const before = Number(available)
  const base = Number.isFinite(before) ? before : 0
  return base + (grant ?? 0)
}
