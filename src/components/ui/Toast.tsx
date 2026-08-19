import { Check, X } from 'lucide-react'

export type ToastVariant = 'success'

export type ToastItem = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastProps = {
  toast: ToastItem
  onDismiss: (id: string) => void
}

/**
 * Single toast row. No action buttons for success (auto-dismiss + optional X).
 */
export function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border-l-[5px] border-l-status-approved bg-surface py-4 pr-3 pl-4 shadow-[0_4px_14px_rgba(33,37,41,0.10),0_1px_3px_rgba(33,37,41,0.06)]"
    >
      {toast.variant === 'success' ? (
        <span
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-status-approved"
          aria-hidden="true"
        >
          <Check className="size-4 stroke-4 text-white" strokeWidth={3} />
        </span>
      ) : null}
      <p className="min-w-0 flex-1 text-body font-semibold text-text-black">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-text-gray transition-colors hover:bg-surface-muted hover:text-text-black focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="Dismiss notification"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
