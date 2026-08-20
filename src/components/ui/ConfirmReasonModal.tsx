import {
  Check,
  CircleX,
  ClipboardCheck,
  FilePlus,
  Pencil,
  RefreshCw,
  Send,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export type ConfirmReasonIconVariant =
  | 'submit'
  | 'conversion'
  | 'cancel'
  | 'reject'
  | 'approve'
  | 'reminder'
  | 'confirm'
  | 'edit'

type ConfirmReasonModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  title: string
  description?: React.ReactNode
  /** When true (default), a reason is required. Set false for simple yes/no confirms. */
  requireReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'danger' | 'primary' | 'reminder'
  iconVariant?: ConfirmReasonIconVariant
}

type IconConfig = {
  Icon: LucideIcon
  badgeClass: string
  iconClass: string
}

const ICON_CONFIG: Record<ConfirmReasonIconVariant, IconConfig> = {
  submit: {
    Icon: FilePlus,
    badgeClass: 'bg-primary/10',
    iconClass: 'text-primary',
  },
  conversion: {
    Icon: RefreshCw,
    badgeClass: 'bg-primary/10',
    iconClass: 'text-primary',
  },
  cancel: {
    Icon: Trash2,
    badgeClass: 'bg-status-rejected/10',
    iconClass: 'text-status-rejected',
  },
  reject: {
    Icon: CircleX,
    badgeClass: 'bg-status-rejected/10',
    iconClass: 'text-status-rejected',
  },
  approve: {
    Icon: Check,
    badgeClass: 'bg-primary/10',
    iconClass: 'text-primary',
  },
  reminder: {
    Icon: Send,
    badgeClass: 'bg-status-pending-conversion/10',
    iconClass: 'text-status-pending-conversion',
  },
  confirm: {
    Icon: ClipboardCheck,
    badgeClass: 'bg-primary/10',
    iconClass: 'text-primary',
  },
  edit: {
    Icon: Pencil,
    badgeClass: 'bg-primary/10',
    iconClass: 'text-primary',
  },
}

function resolveIconVariant({
  iconVariant,
  confirmVariant,
  title,
  confirmLabel,
}: {
  iconVariant?: ConfirmReasonIconVariant
  confirmVariant: 'danger' | 'primary' | 'reminder'
  title: string
  confirmLabel: string
}): ConfirmReasonIconVariant {
  if (iconVariant) return iconVariant

  const titleLower = title.toLowerCase()
  const confirmLower = confirmLabel.toLowerCase()

  if (confirmVariant === 'danger') {
    if (titleLower.includes('cancel')) return 'cancel'
    return 'reject'
  }

  if (titleLower.includes('conversion')) return 'conversion'
  if (titleLower.includes('reminder')) return 'reminder'
  if (titleLower.includes('approve')) return 'approve'
  if (
    titleLower.includes('edit') ||
    confirmLower.includes('save')
  ) {
    return 'edit'
  }
  if (
    titleLower.includes('leave request') ||
    confirmLower.includes('submit')
  ) {
    return 'submit'
  }

  return 'confirm'
}

const SECONDARY_BUTTON_CLASS =
  'inline-flex w-full items-center justify-center rounded-md border border-border bg-surface px-4 py-2.5 text-body font-medium text-text-black transition-colors hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary/20'

/**
 * Centered confirmation dialog with icon badge, optional reason field, and
 * stacked (simple confirm) or side-by-side (reason required) actions.
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
  iconVariant,
}: ConfirmReasonModalProps) {
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)

  const resolvedIconVariant = useMemo(
    () =>
      resolveIconVariant({
        iconVariant,
        confirmVariant,
        title,
        confirmLabel,
      }),
    [iconVariant, confirmVariant, title, confirmLabel],
  )

  const { Icon, badgeClass, iconClass } = ICON_CONFIG[resolvedIconVariant]

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

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') handleClose()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setReason('')
      setTouched(false)
    }
  }, [open])

  const CONFIRM_BASE =
    'inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-body font-medium text-white enabled:transition-opacity enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2'
  const confirmButtonClass =
    confirmVariant === 'danger'
      ? `${CONFIRM_BASE} bg-status-rejected focus:ring-status-rejected/30`
      : confirmVariant === 'reminder'
        ? `${CONFIRM_BASE} bg-status-pending-conversion focus:ring-status-pending-conversion/30`
        : `${CONFIRM_BASE} bg-primary focus:ring-primary/30`

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-overlay"
        aria-label="Close dialog"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface px-6 py-6 shadow-[0_4px_24px_rgba(33,37,41,0.12)]"
      >
        <div className="flex justify-center">
          <span
            className={`inline-flex size-14 items-center justify-center rounded-full ${badgeClass}`}
            aria-hidden="true"
          >
            <Icon className={`size-7 ${iconClass}`} strokeWidth={2} />
          </span>
        </div>

        <h2
          id="confirm-dialog-title"
          className="mt-4 text-center text-h2 font-bold text-text-black"
        >
          {title}
        </h2>

        {description ? (
          <p className="mt-2 text-center text-body text-text-gray">{description}</p>
        ) : null}

        {requireReason ? (
          <label className={`flex flex-col gap-1.5 ${description ? 'mt-5' : 'mt-4'}`}>
            <span className="text-body font-semibold text-text-black">
              {reasonLabel}
              <span className="text-status-rejected"> *</span>
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={2}
              placeholder={reasonPlaceholder}
              className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-body text-text-black outline-none placeholder:text-text-gray focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {showError ? (
              <span className="text-small text-status-rejected">
                Reason is required.
              </span>
            ) : null}
          </label>
        ) : null}

        <div className="mt-6 -mx-6 border-t border-border" />

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={handleClose} className={SECONDARY_BUTTON_CLASS}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={confirmButtonClass}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
