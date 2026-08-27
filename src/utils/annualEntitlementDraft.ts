const DRAFT_KEY = 'leaveforms.annualEntitlementDraft'

export type AnnualEntitlementDraft = {
  year: number
  empIds: number[]
  groupFilter: string
}

/** Passed via router state when navigating back from Review → Select. */
export type AnnualEntitlementSelectLocationState = {
  empIds: number[]
  groupFilter: string
}

export function getAnnualEntitlementDraft(): AnnualEntitlementDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AnnualEntitlementDraft>
    if (
      typeof parsed.year !== 'number' ||
      !Array.isArray(parsed.empIds) ||
      parsed.empIds.length === 0
    ) {
      return null
    }
    return {
      year: parsed.year,
      empIds: parsed.empIds
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
      groupFilter:
        typeof parsed.groupFilter === 'string' ? parsed.groupFilter : 'ALL',
    }
  } catch {
    return null
  }
}

export function setAnnualEntitlementDraft(draft: AnnualEntitlementDraft): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

export function clearAnnualEntitlementDraft(): void {
  sessionStorage.removeItem(DRAFT_KEY)
}

export function formatYearsOfService(years: number): string {
  if (!Number.isFinite(years) || years < 0) return '—'
  return years === 1 ? '1 yr' : `${years} yrs`
}
