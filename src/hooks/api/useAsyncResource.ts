import { useCallback, useEffect, useState } from 'react'

export type AsyncResourceState<T> = {
  data: T | null
  error: Error | null
  isLoading: boolean
  refetch: () => void
}

/**
 * Shared fetch lifecycle for page → hook → `api/*`.
 * Pass stable `deps` (primitives) so the effect does not retrigger every render.
 */
export function useAsyncResource<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[],
  options?: { enabled?: boolean },
): AsyncResourceState<T> {
  const enabled = options?.enabled ?? true
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [reloadKey, setReloadKey] = useState(0)

  const refetch = useCallback(() => {
    setReloadKey((key) => key + 1)
  }, [])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    void loader()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setData(null)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
    // Loader is recreated by the caller; deps + reloadKey drive refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [enabled, reloadKey, ...deps])

  return { data, error, isLoading, refetch }
}
