import { useEffect, useState } from 'react'
import { Modal } from './Modal'

type ConfirmReasonModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  title: string
  description?: string
  /** When true (default), a reason is required. Set false for simple yes/no confirms. */
  requireReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'danger' | 'primary'
}

/**
 * Reusable confirmation modal.
 * - Cancel leave: requireReason (default)
 * - Edit / convert: requireReason={false} for action confirmation only
 */
export function ConfirmReasonModal({
  open,
  onClose,
  onConfirm,
  title,
  description = 'Please provide a reason to continue.',
  requireReason = true,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Enter your reason…',
  confirmLabel = 'Confirm',
  cancelLabel = 'Go back',
  confirmVariant = 'danger',
}: ConfirmReasonModalProps) {
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) {
      setReason('')
      setTouched(false)
    }
  }, [open])

  const trimmed = reason.trim()
  const canConfirm = !requireReason || trimmed.length > 0
  const showError = requireReason && touched && trimmed.length === 0

  function handleClose() {
    setReason('')
    setTouched(false)
    onClose()
  }

  function handleConfirm() {
    if (requireReason) {
      setTouched(true)
      if (!trimmed) return
      onConfirm(trimmed)
    } else {
      onConfirm('')
    }
    setReason('')
    setTouched(false)
  }

  const confirmClass =
    confirmVariant === 'danger'
      ? 'bg-status-rejected text-text-white hover:opacity-90 disabled:opacity-40'
      : 'bg-primary text-text-white hover:opacity-90 disabled:opacity-40'

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      maxWidthClass="max-w-md"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-border bg-surface px-4 py-2 text-body font-medium text-text-black transition-colors hover:bg-surface-muted"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`rounded-md px-4 py-2 text-body font-medium transition-opacity ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {description ? (
        <p className="text-body text-text-gray">{description}</p>
      ) : null}

      {requireReason ? (
        <label className={`flex flex-col gap-1.5 ${description ? 'mt-4' : ''}`}>
          <span className="text-small font-semibold text-text-black">
            {reasonLabel}
            <span className="text-status-rejected"> *</span>
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            rows={4}
            placeholder={reasonPlaceholder}
            className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-body text-text-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {showError ? (
            <span className="text-small text-status-rejected">
              Reason is required.
            </span>
          ) : null}
        </label>
      ) : null}
    </Modal>
  )
}
