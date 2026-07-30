/** Read a cookie value by name (null if missing). */
export function getCookie(name: string): string | null {
  const prefix = `${name}=`
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) {
      return trimmed.slice(prefix.length)
    }
  }
  return null
}

/** Set a cookie available to the whole app (and Vite-proxied /api calls). */
export function setCookie(name: string, value: string): void {
  document.cookie = `${name}=${value}; path=/; SameSite=Lax`
}

/** Clear a cookie by expiring it. */
export function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; Max-Age=0; SameSite=Lax`
}
