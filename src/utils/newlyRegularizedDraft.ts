const DRAFT_KEY = 'leaveforms.newlyRegularizedDraft'

export type NewlyRegularizedDraft = {
  year: number
  empIds: number[]
  groupFilter: string
}

/** Passed via router state when navigating back from Review → Select. */
export type NewlyRegularizedSelectLocationState = {
  empIds: number[]
  groupFilter: string
}

export function getNewlyRegularizedDraft(): NewlyRegularizedDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<NewlyRegularizedDraft>
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

export function setNewlyRegularizedDraft(draft: NewlyRegularizedDraft): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

export function clearNewlyRegularizedDraft(): void {
  sessionStorage.removeItem(DRAFT_KEY)
}

export function formatDisplayDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatMonthsProrated(months: number): string {
  if (!Number.isFinite(months) || months < 0) return '—'
  return months === 1 ? '1 month' : `${months} months`
}
