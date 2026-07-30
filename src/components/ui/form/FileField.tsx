import { useId, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { fieldLabelClassName, fieldShellClassName } from './fieldStyles'

const UPLOAD_DELAY_MS = 900
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

type UploadStatus = 'idle' | 'uploading' | 'error'

type FileFieldProps = {
  label: string
  fileName: string | null
  onChange: (file: File | null) => void
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
  fileName,
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
}: FileFieldProps) {
  const generatedId = useId()
  const inputId = id ?? name ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pendingFileName, setPendingFileName] = useState<string | null>(null)

  const isUploading = status === 'uploading'
  const displayName = isUploading
    ? (pendingFileName ?? 'Uploading…')
    : (fileName ?? 'No file chosen')
  const displayError = uploadError ?? error ?? null

  async function handleFileSelected(file: File | null) {
    setUploadError(null)

    if (!file) {
      setStatus('idle')
      setPendingFileName(null)
      onUploadingChange?.(false)
      onChange(null)
      return
    }

    setStatus('uploading')
    setPendingFileName(file.name)
    onChange(null)
    onUploadingChange?.(true)

    try {
      await mockUploadFile(file)
      setStatus('idle')
      setPendingFileName(null)
      onUploadingChange?.(false)
      onChange(file)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setStatus('error')
      setPendingFileName(null)
      setUploadError(message)
      onUploadingChange?.(false)
      onChange(null)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={inputId} className={fieldLabelClassName}>
        {label}
        {required ? <span className="text-status-rejected"> *</span> : null}
      </label>
      <div className={`flex flex-wrap items-center gap-3 ${fieldShellClassName}`}>
        <label
          htmlFor={isUploading || disabled ? undefined : inputId}
          aria-disabled={isUploading || disabled}
          className={[
            'box-border inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-3 py-2.5 text-body leading-normal text-text-black transition-[border-color,box-shadow]',
            isUploading || disabled
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer hover:border-primary/50 hover:bg-surface-muted focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
          ].join(' ')}
        >
          Choose file
        </label>
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept={accept}
          disabled={isUploading || disabled}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            void handleFileSelected(file)
          }}
        />
        <span
          className="inline-flex min-w-0 items-center gap-2 text-body text-text-gray"
          aria-live="polite"
        >
          {isUploading ? (
            <>
              <Loader2
                className="size-4 shrink-0 animate-spin text-primary"
                aria-hidden="true"
              />
              <span className="truncate">
                Uploading{pendingFileName ? ` “${pendingFileName}”` : ''}…
              </span>
            </>
          ) : (
            <span className="truncate">{displayName}</span>
          )}
        </span>
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
