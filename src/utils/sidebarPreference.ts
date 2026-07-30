const SIDEBAR_COLLAPSED_KEY = 'leaveforms.sidebar.collapsed'

export function readSidebarCollapsedPreference(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export function writeSidebarCollapsedPreference(collapsed: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
  } catch {
    // Ignore storage failures (private mode, quotas, etc.)
  }
}
