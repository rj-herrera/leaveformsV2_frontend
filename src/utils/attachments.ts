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
