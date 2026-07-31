import axios, { AxiosError } from 'axios'

/**
 * Shared Axios instance for the Leave Forms API.
 * Base path is `/api` (Vite proxies to http://127.0.0.1:8000 in dev).
 */
export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export const axiosClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

function messageFromPayload(payload: unknown, status: number): string {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof (payload as { message: unknown }).message === 'string'
  ) {
    return (payload as { message: string }).message
  }
  return `Request failed (${status})`
}

axiosClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError) {
      const status = error.response?.status ?? 0
      const payload = error.response?.data ?? null
      return Promise.reject(
        new ApiError(status, messageFromPayload(payload, status), payload),
      )
    }
    return Promise.reject(error)
  },
)
