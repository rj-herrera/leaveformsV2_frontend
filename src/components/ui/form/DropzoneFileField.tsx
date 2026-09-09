import { useId, useRef, useState } from 'react'
import { FolderUp, Loader2, Paperclip, X } from 'lucide-react'
import { fieldLabelClassName, fieldShellClassName } from './fieldStyles'

const UPLOAD_DELAY_MS = 900
// File size validation is disabled for now. Re-enable if product/API needs a cap again:
// const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const DEFAULT_MAX_FILES = 5

type DropzoneFileFieldProps = {
  label: string
  files: File[]
  onChange: (files: File[]) => void
  /** Notifies parents when an upload starts or finishes (success or error). */
  onUploadingChange?: (uploading: boolean) => void
  accept?: string
  required?: boolean
  error?: string | null
  hint?: string
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
  size: number
}

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`
  }
  const mb = bytes / (1024 * 1024)
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
}

async function mockUploadFile(file: File): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, UPLOAD_DELAY_MS)
  })

  if (file.size <= 0) {
    throw new Error('The selected file is empty.')
  }
  // File size limit checks intentionally omitted for now.
  // Example (re-enable with MAX_UPLOAD_BYTES above if needed):
  // if (file.size > MAX_UPLOAD_BYTES) {
  //   throw new Error('File is too large (max 10 MB).')
  // }
}

/**
 * Drag-and-drop upload UI used by Convert to Sick Leave.
 * File Leave pages continue to use the classic {@link FileField}.
 */
export function DropzoneFileField({
  label,
  files,
  onChange,
  onUploadingChange,
  accept,
  required = false,
  error,
  hint,
  name,
  id,
  className = '',
  disabled = false,
  multiple = true,
  maxFiles = DEFAULT_MAX_FILES,
}: DropzoneFileFieldProps) {
  const generatedId = useId()
  const inputId = id ?? name ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const isUploading = pendingUploads.length > 0
  const atMax = files.length >= maxFiles
  const chooseDisabled = disabled || isUploading || atMax
  const displayError = uploadError ?? error ?? null
  const chooseLabel = 'choose files'
  const hasFileList = files.length > 0 || isUploading

  function openFilePicker() {
    if (chooseDisabled) return
    inputRef.current?.click()
  }

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
      size: file.size,
    }))
    setPendingUploads(pending)
    onUploadingChange?.(true)

    const uploaded: File[] = []
    const failures: string[] = []

    for (const file of toUpload) {
      const key = fileKey(file)
      try {
        await mockUploadFile(file)
        uploaded.push(file)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Upload failed. Please try again.'
        failures.push(`${file.name}: ${message}`)
      } finally {
        setPendingUploads((prev) => prev.filter((item) => item.key !== key))
      }
    }

    if (uploaded.length > 0) {
      onChange([...files, ...uploaded].slice(0, maxFiles))
    }

    const messages = [
      ...failures,
      skipped > 0 ? `You can attach up to ${maxFiles} files. ${skipped} file(s) were not added.` : null,
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

  function handleDragEnter(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (chooseDisabled) return
    setIsDragging(true)
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (chooseDisabled) return
    event.dataTransfer.dropEffect = 'copy'
    setIsDragging(true)
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (event.currentTarget.contains(event.relatedTarget as Node)) return
    setIsDragging(false)
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    if (chooseDisabled) return
    void handleFilesSelected(event.dataTransfer.files)
  }

  return (
    <div
      className={`flex min-h-0 min-w-0 flex-[0_1_auto] flex-col overflow-hidden ${className}`}
    >
      <label htmlFor={inputId} className={`shrink-0 ${fieldLabelClassName}`}>
        {label}
        {required ? <span className="text-status-rejected"> *</span> : null}
      </label>

      <div
        className={`relative flex min-h-0 flex-1 flex-col gap-3 overflow-hidden ${fieldShellClassName}`}
      >
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

        <div
          role="button"
          tabIndex={chooseDisabled ? -1 : 0}
          aria-disabled={chooseDisabled}
          aria-label={
            multiple
              ? 'Upload files. Drag and drop or choose files.'
              : 'Upload file. Drag and drop or choose file.'
          }
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (chooseDisabled) return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openFilePicker()
            }
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={[
            'flex shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-[border-color,background-color,opacity] sm:py-8',
            chooseDisabled
              ? 'cursor-not-allowed border-border bg-surface-muted opacity-60'
              : isDragging
                ? 'cursor-pointer border-primary bg-primary/5'
                : 'cursor-pointer border-border bg-surface hover:border-primary/50 hover:bg-surface-muted',
          ].join(' ')}
        >
          <span className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FolderUp className="size-6" aria-hidden="true" />
          </span>
          <p className="text-body text-text-black">
            Drag & drop files here or{' '}
            <button
              type="button"
              disabled={chooseDisabled}
              onClick={(event) => {
                event.stopPropagation()
                openFilePicker()
              }}
              className="font-medium text-primary underline-offset-2 enabled:hover:underline disabled:cursor-not-allowed"
            >
              {chooseLabel}
            </button>
          </p>
        </div>

        {hasFileList ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ul
              className="flex flex-col gap-2"
              aria-live="polite"
              aria-label="Selected files"
            >
              {files.map((file) => (
                <li key={fileKey(file)}>
                  <FileCard
                    name={file.name}
                    sizeLabel={formatBytes(file.size)}
                    uploading={false}
                    onRemove={disabled ? undefined : () => removeFile(file)}
                  />
                </li>
              ))}
              {pendingUploads.map((item) => (
                <li key={item.key}>
                  <FileCard
                    name={item.name}
                    sizeLabel={formatBytes(item.size)}
                    uploading
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {hint && !displayError ? (
        <p className="mt-1 shrink-0 text-small text-text-gray">{hint}</p>
      ) : null}
      {displayError ? (
        <p
          className="mt-1 shrink-0 text-small text-status-rejected"
          role="alert"
        >
          {displayError}
        </p>
      ) : null}
    </div>
  )
}

function FileCard({
  name,
  sizeLabel,
  uploading,
  onRemove,
}: {
  name: string
  sizeLabel: string
  uploading: boolean
  onRemove?: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Paperclip className="size-4" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-text-black" title={name}>
          {name}
        </p>
        <p className="mt-0.5 text-small text-text-gray">{sizeLabel}</p>
      </div>

      {uploading ? (
        <Loader2
          className="size-4 shrink-0 animate-spin text-primary"
          aria-label={`Uploading ${name}`}
        />
      ) : onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-status-rejected transition-colors hover:bg-status-rejected/10 focus:outline-none focus:ring-2 focus:ring-status-rejected/30"
          aria-label={`Remove ${name}`}
          title="Remove file"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
