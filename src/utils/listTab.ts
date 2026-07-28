/**
 * Shared list-tab query helpers for Approver / Admin leave request lists.
 */
export type ListTab = 'pending' | 'all'

export const LIST_TAB_QUERY_KEY = 'tab'

export type ListReturnState = {
  listTab?: ListTab
}

export function parseListTab(value: string | null | undefined): ListTab {
  return value === 'all' ? 'all' : 'pending'
}

export function listPathWithTab(basePath: string, tab: ListTab): string {
  return `${basePath}?${LIST_TAB_QUERY_KEY}=${tab}`
}

export function listTabFromLocationState(
  state: unknown,
  fallback: ListTab = 'pending',
): ListTab {
  if (
    state &&
    typeof state === 'object' &&
    'listTab' in state &&
    (state as ListReturnState).listTab === 'all'
  ) {
    return 'all'
  }
  if (
    state &&
    typeof state === 'object' &&
    'listTab' in state &&
    (state as ListReturnState).listTab === 'pending'
  ) {
    return 'pending'
  }
  return fallback
}
