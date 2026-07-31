import type { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { ApiError } from '../api/axios-client'

type Props = {
  children: ReactNode
}

/**
 * App-wide SWR defaults. Domain hooks (`useMyLeaves`, etc.) call `api/*`
 * fetchers; after writes, revalidate with `mutate(swrKeys.…)` or hook `mutate`.
 */
export function SwrProvider({ children }: Props) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        shouldRetryOnError: (error: unknown) => {
          // Don't retry auth / validation failures.
          if (error instanceof ApiError) {
            return error.status !== 401 && error.status !== 403 && error.status !== 422
          }
          return true
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}
