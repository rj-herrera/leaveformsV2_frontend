import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Toast, type ToastItem, type ToastVariant } from './Toast'

/** Default time on screen for short success messages. */
export const TOAST_DURATION_MS = 4500

type ToastOptions = {
  durationMs?: number
  variant?: ToastVariant
}

type ToastApi = {
  success: (message: string, options?: Omit<ToastOptions, 'variant'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

function createToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, number>>(new Map())

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer != null) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = createToastId()
      const variant = options?.variant ?? 'success'
      const durationMs = options?.durationMs ?? TOAST_DURATION_MS

      setToasts((prev) => [...prev, { id, message, variant }])

      const timer = window.setTimeout(() => {
        dismiss(id)
      }, durationMs)
      timersRef.current.set(id, timer)
    },
    [dismiss],
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer)
      }
      timers.clear()
    }
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, options) => push(message, { ...options, variant: 'success' }),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed top-4 right-4 z-[60] flex w-[min(100%-2rem,24rem)] flex-col gap-2"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
