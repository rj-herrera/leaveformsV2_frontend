import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Minus,
  Plus,
  X,
} from 'lucide-react'
import {
  fileNameFromContentDisposition,
  fileNameFromUrl,
  isImageFileName,
  isImageMimeType,
  isPdfFileName,
  isPdfMimeType,
  isSameOriginAttachmentUrl,
  toSameOriginApiUrl,
  type AttachmentFile,
} from '../../utils/attachments'

type AttachmentPreviewModalProps = {
  open: boolean
  onClose: () => void
  /** Preferred: one or more files to preview */
  files?: AttachmentFile[]
  /**
   * Single-file shorthand (still supported).
   * Prefer `files` when opening multiple attachments.
   */
  fileName?: string
  /** Preview URL for the single-file shorthand */
  previewUrl?: string | null
  /** Starting file index when `files` has more than one entry */
  initialIndex?: number
}

const DEFAULT_ZOOM = 1
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.1

type LoadedAttachment = {
  objectUrl: string
  mime: string
  downloadName: string
}

export function AttachmentPreviewModal({
  open,
  onClose,
  files,
  fileName = '',
  previewUrl = null,
  initialIndex = 0,
}: AttachmentPreviewModalProps) {
  const resolvedFiles: AttachmentFile[] =
    files && files.length > 0
      ? files
      : fileName
        ? [{ name: fileName, previewUrl }]
        : []

  const fileCount = resolvedFiles.length
  const [currentIndex, setCurrentIndex] = useState(0)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [loaded, setLoaded] = useState<LoadedAttachment | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingFile, setLoadingFile] = useState(false)

  useEffect(() => {
    if (!open) return
    const maxIndex = Math.max(0, fileCount - 1)
    const nextIndex = Math.min(Math.max(0, initialIndex), maxIndex)
    setCurrentIndex(nextIndex)
    setZoom(DEFAULT_ZOOM)
  }, [open, initialIndex, fileCount])

  useEffect(() => {
    setZoom(DEFAULT_ZOOM)
  }, [currentIndex])

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key === 'ArrowLeft') {
        setCurrentIndex((index) => Math.max(0, index - 1))
        return
      }
      if (event.key === 'ArrowRight') {
        setCurrentIndex((index) => Math.min(fileCount - 1, index + 1))
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose, fileCount])

  const current = resolvedFiles[currentIndex]
  const currentName = current?.name ?? 'Attachment'
  const currentPreviewUrl = toSameOriginApiUrl(current?.previewUrl ?? null)

  useEffect(() => {
    if (!open || !currentPreviewUrl) {
      setLoaded(null)
      setLoadError(null)
      setLoadingFile(false)
      return
    }

    // External / signed URLs: use directly (no cookie fetch).
    if (!isSameOriginAttachmentUrl(currentPreviewUrl)) {
      setLoaded({
        objectUrl: currentPreviewUrl,
        mime: '',
        downloadName:
          fileNameFromUrl(currentPreviewUrl) ??
          (isImageFileName(currentName) || isPdfFileName(currentName)
            ? currentName
            : `${currentName}`),
      })
      setLoadError(null)
      setLoadingFile(false)
      return
    }

    let cancelled = false
    let objectUrl: string | null = null
    setLoadingFile(true)
    setLoadError(null)
    setLoaded(null)

    void (async () => {
      try {
        const response = await fetch(currentPreviewUrl, {
          credentials: 'include',
          headers: { Accept: '*/*' },
        })
        if (!response.ok) {
          throw new Error(`Unable to load attachment (${response.status}).`)
        }

        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        if (cancelled) {
          URL.revokeObjectURL(objectUrl)
          return
        }

        const headerName = fileNameFromContentDisposition(
          response.headers.get('Content-Disposition'),
        )
        const urlName = fileNameFromUrl(currentPreviewUrl)
        const hasExtension =
          isImageFileName(currentName) || isPdfFileName(currentName)
        const downloadName =
          headerName ??
          urlName ??
          (hasExtension
            ? currentName
            : isPdfMimeType(blob.type)
              ? `${currentName}.pdf`
              : isImageMimeType(blob.type)
                ? `${currentName}.${blob.type.split('/')[1] ?? 'img'}`
                : currentName)

        setLoaded({
          objectUrl,
          mime: blob.type,
          downloadName,
        })
      } catch (error) {
        if (cancelled) return
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unable to load attachment.',
        )
        setLoaded(null)
      } finally {
        if (!cancelled) setLoadingFile(false)
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [open, currentPreviewUrl, currentName, currentIndex])

  if (!open) return null

  const displayUrl = loaded?.objectUrl ?? null
  const showImage = Boolean(
    displayUrl &&
      (isImageMimeType(loaded?.mime) ||
        isImageFileName(loaded?.downloadName ?? '') ||
        isImageFileName(currentName)),
  )
  const showPdf = Boolean(
    displayUrl &&
      !showImage &&
      (isPdfMimeType(loaded?.mime) ||
        isPdfFileName(loaded?.downloadName ?? '') ||
        isPdfFileName(currentName)),
  )
  /** Unknown type with a URL — embed so PDFs/images from extensionless API routes still show. */
  const showEmbed = Boolean(displayUrl && !showImage && !showPdf)
  const hasMultiple = fileCount > 1
  const canDownload = Boolean(displayUrl)

  function goPrevious() {
    setCurrentIndex((index) => Math.max(0, index - 1))
  }

  function goNext() {
    setCurrentIndex((index) => Math.min(fileCount - 1, index + 1))
  }

  function zoomIn() {
    setZoom((value) =>
      Math.min(MAX_ZOOM, Number((value + ZOOM_STEP).toFixed(2))),
    )
  }

  function zoomOut() {
    setZoom((value) =>
      Math.max(MIN_ZOOM, Number((value - ZOOM_STEP).toFixed(2))),
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 "
        aria-label="Close attachment preview"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="attachment-preview-title"
        className="relative z-10 flex h-[90vh] w-[80vw] max-w-[80vw] flex-col overflow-hidden rounded-lg border border-white/15 bg-black/75 backdrop-blur-[2.5px] shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2
              id="attachment-preview-title"
              className="truncate text-h2 text-white"
            >
              {currentName}
            </h2>
            {hasMultiple ? (
              <p className="mt-0.5 text-body text-white/75">
                File {currentIndex + 1} of {fileCount}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {canDownload ? (
              <a
                href={displayUrl!}
                download={loaded?.downloadName ?? currentName}
                className="inline-flex size-10 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10"
                aria-label={`Download ${currentName}`}
              >
                <Download className="size-5" aria-hidden="true" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex size-10 items-center justify-center rounded-md text-white opacity-40"
                aria-label="Download unavailable"
                title={
                  loadingFile
                    ? 'Loading file…'
                    : 'Download unavailable — no file URL'
                }
              >
                <Download className="size-5" aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-10 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-14 pb-20 pt-3 sm:px-16">
          {hasMultiple ? (
            <button
              type="button"
              onClick={goPrevious}
              disabled={currentIndex <= 0}
              className="absolute top-1/2 left-2 z-20 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-30 sm:left-3"
              aria-label="Previous file"
            >
              <ChevronLeft className="size-8" aria-hidden="true" />
            </button>
          ) : null}

          {fileCount === 0 ? (
            <p className="text-body text-white/80">No attachment to preview.</p>
          ) : loadingFile ? (
            <p className="text-body text-white/80">Loading attachment…</p>
          ) : loadError ? (
            <div className="flex max-w-md flex-col items-center gap-3 rounded-lg bg-white/10 px-8 py-10 text-center">
              <span className="flex size-16 items-center justify-center rounded-lg bg-white/15 text-white">
                <FileText className="size-8" aria-hidden="true" />
              </span>
              <div>
                <p className="text-h2 text-white">{currentName}</p>
                <p className="mt-1 text-body text-white/75">{loadError}</p>
              </div>
            </div>
          ) : !currentPreviewUrl ? (
            <div className="flex max-w-md flex-col items-center gap-3 rounded-lg bg-white/10 px-8 py-10 text-center">
              <span className="flex size-16 items-center justify-center rounded-lg bg-white/15 text-white">
                <FileText className="size-8" aria-hidden="true" />
              </span>
              <div>
                <p className="text-h2 text-white">{currentName}</p>
                <p className="mt-1 text-body text-white/75">
                  No file URL is available for this attachment.
                </p>
              </div>
            </div>
          ) : showImage ? (
            <div className="flex h-full max-h-full w-full max-w-full items-center justify-center overflow-auto">
              <img
                src={displayUrl!}
                alt={currentName}
                className="max-h-full max-w-full object-contain transition-transform duration-150"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          ) : showPdf || showEmbed ? (
            <iframe
              src={displayUrl!}
              title={currentName}
              className="h-full w-full rounded-md bg-white"
            />
          ) : (
            <div className="flex max-w-md flex-col items-center gap-3 rounded-lg bg-white/10 px-8 py-10 text-center">
              <span className="flex size-16 items-center justify-center rounded-lg bg-white/15 text-white">
                <FileText className="size-8" aria-hidden="true" />
              </span>
              <div>
                <p className="text-h2 text-white">{currentName}</p>
                <p className="mt-1 text-body text-white/75">
                  Preview is unavailable for this file type. Use Download
                  instead.
                </p>
              </div>
            </div>
          )}

          {hasMultiple ? (
            <button
              type="button"
              onClick={goNext}
              disabled={currentIndex >= fileCount - 1}
              className="absolute top-1/2 right-2 z-20 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-30 sm:right-3"
              aria-label="Next file"
            >
              <ChevronRight className="size-8" aria-hidden="true" />
            </button>
          ) : null}

          {showImage ? (
            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/55 px-2 py-1.5 backdrop-blur-sm">
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoom <= MIN_ZOOM}
                className="inline-flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Zoom out"
              >
                <Minus className="size-5" aria-hidden="true" />
              </button>
              <span className="text-body min-w-14 text-center font-medium text-white">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={zoomIn}
                disabled={zoom >= MAX_ZOOM}
                className="inline-flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Zoom in"
              >
                <Plus className="size-5" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
