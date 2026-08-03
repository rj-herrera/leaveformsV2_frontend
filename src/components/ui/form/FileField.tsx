import { useId, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { fieldLabelClassName, fieldShellClassName } from './fieldStyles'

const UPLOAD_DELAY_MS = 900
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const DEFAULT_MAX_FILES = 5

type FileFieldProps = {
  label: string
  files: File[]
  onChange: (files: File[]) => void
  /** Notifies parents when an upload starts or finishes (success or error). */
  onUploadingChange?: (uploading: boolean) => void
  accept?: string
  required?: boolean
  hint?: string
  error?: string | null
  name?: string
  id?: string
  className?: string
  disabled?: boolean
  /** Allow selecting more than one file. Default true. */
  multiple?: boolean
  /** Maximum number of files when multiple is enabled. Default 5. */
  maxFiles?: number
}

type PendingUpload = {
  key: string
  name: string
}

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`
}

async function mockUploadFile(file: File): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, UPLOAD_DELAY_MS)
  })

  if (file.size <= 0) {
    throw new Error('The selected file is empty.')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File is too large (max 10 MB).')
  }
}

export function FileField({
  label,
  files,
  onChange,
  onUploadingChange,
  accept,
  required = false,
  hint,
  error,
  name,
  id,
  className = '',
  disabled = false,
  multiple = true,
  maxFiles = DEFAULT_MAX_FILES,
}: FileFieldProps) {
  const generatedId = useId()
  const inputId = id ?? name ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)

  const isUploading = pendingUploads.length > 0
  const atMax = files.length >= maxFiles
  const chooseDisabled = disabled || isUploading || atMax
  const displayError = uploadError ?? error ?? null

  async function handleFilesSelected(selected: FileList | null) {
    setUploadError(null)
    if (!selected || selected.length === 0) return

    const incoming = Array.from(selected)
    const existingKeys = new Set(files.map(fileKey))
    const uniqueIncoming = incoming.filter((file) => !existingKeys.has(fileKey(file)))

    if (uniqueIncoming.length === 0) {
      setUploadError('That file is already attached.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    const remainingSlots = Math.max(0, maxFiles - files.length)
    const toUpload = uniqueIncoming.slice(0, remainingSlots)
    const skipped = uniqueIncoming.length - toUpload.length

    if (toUpload.length === 0) {
      setUploadError(`You can attach up to ${maxFiles} files.`)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    const pending = toUpload.map((file) => ({
      key: fileKey(file),
      name: file.name,
    }))
    setPendingUploads(pending)
    onUploadingChange?.(true)

    const uploaded: File[] = []
    const failures: string[] = []

    for (const file of toUpload) {
      try {
        await mockUploadFile(file)
        uploaded.push(file)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Upload failed. Please try again.'
        failures.push(`${file.name}: ${message}`)
      } finally {
        setPendingUploads((prev) =>
          prev.filter((item) => item.key !== fileKey(file)),
        )
      }
    }

    if (uploaded.length > 0) {
      onChange([...files, ...uploaded].slice(0, maxFiles))
    }

    const messages = [
      ...failures,
      skipped > 0 ? `Only ${maxFiles} files are allowed; ${skipped} skipped.` : null,
    ].filter(Boolean) as string[]

    setUploadError(messages.length > 0 ? messages.join(' ') : null)
    onUploadingChange?.(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeFile(target: File) {
    const key = fileKey(target)
    onChange(files.filter((file) => fileKey(file) !== key))
    setUploadError(null)
  }

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={inputId} className={fieldLabelClassName}>
        {label}
        {required ? <span className="text-status-rejected"> *</span> : null}
      </label>

      <div className={`flex flex-col gap-3 ${fieldShellClassName}`}>
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor={chooseDisabled ? undefined : inputId}
            aria-disabled={chooseDisabled}
            className={[
              'box-border inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-3 py-2.5 text-body leading-normal text-text-black transition-[border-color,box-shadow]',
              chooseDisabled
                ? 'cursor-not-allowed opacity-60'
                : 'cursor-pointer hover:border-primary/50 hover:bg-surface-muted focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
            ].join(' ')}
          >
            {multiple ? 'Choose files' : 'Choose file'}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            name={name}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={chooseDisabled}
            className="sr-only"
            onChange={(e) => {
              void handleFilesSelected(e.target.files)
            }}
          />
          {files.length === 0 && !isUploading ? (
            <span className="text-body text-text-gray">No file chosen</span>
          ) : null}
        </div>

        {(files.length > 0 || isUploading) && (
          <ul
            className="flex flex-wrap gap-2"
            aria-live="polite"
            aria-label="Selected files"
          >
            {files.map((file) => (
              <li key={fileKey(file)}>
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-surface-muted py-1 pr-1 pl-3 text-small text-text-black">
                  <span className="truncate" title={file.name}>
                    {file.name}
                  </span>
                  {!disabled ? (
                    <button
                      type="button"
                      onClick={() => removeFile(file)}
                      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-text-gray transition-colors hover:bg-surface hover:text-text-black focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`Remove ${file.name}`}
                      title="Remove file"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
            {pendingUploads.map((item) => (
              <li key={item.key}>
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 py-1 pr-2.5 pl-3 text-small text-primary">
                  <Loader2
                    className="size-3.5 shrink-0 animate-spin"
                    aria-hidden="true"
                  />
                  <span className="truncate" title={item.name}>
                    Uploading “{item.name}”…
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {hint && !displayError ? (
        <p className="mt-1 text-small text-text-gray">{hint}</p>
      ) : null}
      {displayError ? (
        <p className="mt-1 text-small text-status-rejected" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  )
}
