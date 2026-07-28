import { FileText } from 'lucide-react'
import { Modal } from './Modal'

type AttachmentPreviewModalProps = {
  open: boolean
  onClose: () => void
  fileName: string
  /** Optional preview image URL; falls back to a document placeholder */
  previewUrl?: string | null
}

export function AttachmentPreviewModal({
  open,
  onClose,
  fileName,
  previewUrl = null,
}: AttachmentPreviewModalProps) {
  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(fileName)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attachment preview"
      maxWidthClass="max-w-3xl"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-border bg-surface px-4 py-2 text-body text-text-black transition-colors hover:bg-surface-muted"
        >
          Close
        </button>
      }
    >
      <p className="text-small text-text-gray mb-3">{fileName}</p>

      <div className="flex min-h-[320px] items-center justify-center rounded-md border border-border bg-surface-muted p-4">
        {isImage && previewUrl ? (
          <img
            src={previewUrl}
            alt={fileName}
            className="max-h-[55vh] max-w-full rounded object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-body font-semibold text-text-black">
                {fileName}
              </p>
              <p className="text-small text-text-gray mt-1">
                Preview placeholder — file content will load from the API later.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
