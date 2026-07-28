import { CheckCircle2 } from 'lucide-react'
import { Modal } from './Modal'

type SuccessDialogProps = {
  open: boolean
  onClose: () => void
  title?: string
  message: string
  confirmLabel?: string
}

/**
 * Reusable success dialog shown after a confirmed action completes
 * (cancel, edit, convert, etc.).
 */
export function SuccessDialog({
  open,
  onClose,
  title = 'Success',
  message,
  confirmLabel = 'OK',
}: SuccessDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidthClass="max-w-md"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-primary px-4 py-2 text-body font-semibold text-white transition-opacity hover:opacity-90"
        >
          {confirmLabel}
        </button>
      }
    >
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
        <CheckCircle2
          className="size-10 shrink-0 text-status-approved"
          aria-hidden="true"
        />
        <p className="text-body text-text-gray">{message}</p>
      </div>
    </Modal>
  )
}
