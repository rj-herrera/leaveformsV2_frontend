/**
 * Split attachment field values into individual file names.
 * Supports a single name or comma-separated names (e.g. multi-upload mocks).
 */
export function parseAttachmentFileNames(
  value: string | null | undefined,
): string[] {
  if (!value) return []

  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

export type AttachmentFile = {
  name: string
  /** Optional image URL; falls back to a document placeholder when missing */
  previewUrl?: string | null
}

/** Public sample images used for Sick Leave mock previews. */
const PUBLIC_ATTACHMENT_PREVIEWS: Record<string, string> = {
  'medcert.png': '/medcert.png',
  'rx.png': '/rx.png',
}

/** Build attachment file entries from a stored name string (single or comma-separated). */
export function attachmentFilesFromNames(
  value: string | null | undefined,
): AttachmentFile[] {
  return parseAttachmentFileNames(value).map((name) => ({
    name,
    previewUrl: PUBLIC_ATTACHMENT_PREVIEWS[name] ?? null,
  }))
}

export function isImageFileName(name: string) {
  return /\.(png|jpe?g|gif|webp)$/i.test(name)
}

export function isPdfFileName(name: string) {
  return /\.pdf$/i.test(name)
}

/** True for relative paths and same-origin absolute URLs (cookie auth works). */
export function isSameOriginAttachmentUrl(url: string): boolean {
  if (url.startsWith('/')) return true
  try {
    return new URL(url, window.location.origin).origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * Rewrite absolute backend API URLs (e.g. http://127.0.0.1:8000/api/...) to a
 * same-origin `/api/...` path so Vite proxy + cookie auth work in the browser.
 * Non-API URLs (signed CDN links, etc.) are returned unchanged.
 */
export function toSameOriginApiUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/api/') || trimmed === '/api') return trimmed

  try {
    const parsed = new URL(trimmed, window.location.origin)
    if (parsed.pathname.startsWith('/api/') || parsed.pathname === '/api') {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
    }
  } catch {
    // fall through
  }

  return trimmed
}

/** Map API `{ name, url }` rows into preview-modal entries (cookie-auth same-origin URLs). */
export function previewFilesFromStored(
  attachments:
    | { name: string; url: string }[]
    | null
    | undefined,
): AttachmentFile[] {
  return (attachments ?? []).map((item) => ({
    name: item.name,
    previewUrl: toSameOriginApiUrl(item.url),
  }))
}

/** Best-effort filename from a URL path (ignores query/hash). */
export function fileNameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const path = url.startsWith('/')
      ? url.split('?')[0]?.split('#')[0] ?? url
      : new URL(url, window.location.origin).pathname
    const base = path.split('/').filter(Boolean).pop()
    if (!base || base === 'attachment' || base === 'med-cert') return null
    return decodeURIComponent(base)
  } catch {
    return null
  }
}

/** Parse `filename` / `filename*` from a Content-Disposition header. */
export function fileNameFromContentDisposition(
  header: string | null | undefined,
): string | null {
  if (!header) return null

  const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^"(.*)"$/, '$1'))
    } catch {
      return utf8Match[1].trim().replace(/^"(.*)"$/, '$1')
    }
  }

  const plainMatch = /filename\s*=\s*("?)([^";]+)\1/i.exec(header)
  if (plainMatch?.[2]) return plainMatch[2].trim()

  return null
}

export function isImageMimeType(mime: string | null | undefined) {
  return Boolean(mime && mime.startsWith('image/'))
}

export function isPdfMimeType(mime: string | null | undefined) {
  return mime === 'application/pdf'
}
