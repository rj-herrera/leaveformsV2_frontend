import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { clearCookie } from '../utils/cookies'

/**
 * Shared Axios instance for the Leave Forms API.
 * Base path is `/api` (Vite proxies to http://127.0.0.1:8000 in dev).
 *
 * Laravel JsonResources wrap payloads as `{ data: T }` (lists may also include
 * `links` / `meta`). Use the `api*Data` / `apiGetList` helpers for those.
 * Use `apiPostFormData` for multipart uploads (SL `leave_attachment`, conversion `med_cert`) —
 * do not force `Content-Type: application/json`.
 * Plain endpoints like `/me` and `/dev/login` are not wrapped — call
 * `axiosClient` directly for those.
 *
 * On 401 with `login_url`, clears the session cookie and redirects (local →
 * `/login`, otherwise → portal `login_url`).
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

const AUTH_COOKIE_NAME = 'userID'

/** Prevents multiple parallel 401s from stacking redirects. */
let handlingUnauthorized = false

function loginUrlFromPayload(payload: unknown): string | null {
  if (
    payload &&
    typeof payload === 'object' &&
    'login_url' in payload &&
    typeof (payload as { login_url: unknown }).login_url === 'string'
  ) {
    const url = (payload as { login_url: string }).login_url.trim()
    return url.length > 0 ? url : null
  }
  return null
}

function requestPath(error: AxiosError): string {
  return error.config?.url ?? ''
}

/**
 * Clear session and send the browser to login.
 * Local/dev uses the SPA `/login` page; other builds use the API's portal URL.
 */
function handleUnauthorized(payload: unknown, requestUrl: string): void {
  if (handlingUnauthorized) return
  // Dev login failures are not a lost session — leave the UI to show the error.
  if (requestUrl.includes('/dev/login')) return

  const loginUrl = loginUrlFromPayload(payload)
  if (!loginUrl) return

  handlingUnauthorized = true
  clearCookie(AUTH_COOKIE_NAME)

  const redirectTo = import.meta.env.DEV ? '/login' : loginUrl

  if (
    import.meta.env.DEV &&
    (window.location.pathname === '/login' ||
      window.location.pathname === '/login/')
  ) {
    handlingUnauthorized = false
    return
  }

  window.location.href = redirectTo
}

/** Laravel LengthAwarePaginator `meta` on resource collections. */
export type PaginationMeta = {
  current_page: number
  from: number | null
  last_page: number
  path: string
  per_page: number
  to: number | null
  total: number
}

export type PaginationLinks = {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export type Paginated<T> = {
  data: T[]
  meta?: PaginationMeta
  links?: PaginationLinks
}

type DataEnvelope<T> = { data: T }

type ListEnvelope<T> = {
  data: T[]
  links?: PaginationLinks
  meta?: PaginationMeta
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
      if (status === 401) {
        handleUnauthorized(payload, requestPath(error))
      }
      return Promise.reject(
        new ApiError(status, messageFromPayload(payload, status), payload),
      )
    }
    return Promise.reject(error)
  },
)

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as DataEnvelope<T>).data
  }
  throw new ApiError(
    0,
    'Unexpected API response: missing data envelope',
    payload,
  )
}

function unwrapList<T>(payload: unknown): Paginated<T> {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray((payload as ListEnvelope<T>).data)
  ) {
    const envelope = payload as ListEnvelope<T>
    return {
      data: envelope.data,
      meta: envelope.meta,
      links: envelope.links,
    }
  }
  throw new ApiError(
    0,
    'Unexpected API response: missing data array',
    payload,
  )
}

/** GET a single JsonResource: `{ data: T }` → `T`. */
export async function apiGetData<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await axiosClient.get<DataEnvelope<T>>(url, config)
  return unwrapData<T>(data)
}

/**
 * GET a JsonResource collection (optionally paginated):
 * `{ data: T[], meta?, links? }` → `{ data, meta?, links? }`.
 */
export async function apiGetList<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<Paginated<T>> {
  const { data } = await axiosClient.get<ListEnvelope<T>>(url, config)
  return unwrapList<T>(data)
}

/** POST returning a JsonResource: `{ data: T }` → `T`. */
export async function apiPostData<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await axiosClient.post<DataEnvelope<T>>(url, body, config)
  return unwrapData<T>(data)
}

/** PUT returning a JsonResource: `{ data: T }` → `T`. */
export async function apiPutData<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await axiosClient.put<DataEnvelope<T>>(url, body, config)
  return unwrapData<T>(data)
}

/** PATCH returning a JsonResource: `{ data: T }` → `T`. */
export async function apiPatchData<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await axiosClient.patch<DataEnvelope<T>>(url, body, config)
  return unwrapData<T>(data)
}

/** DELETE returning a JsonResource: `{ data: T }` → `T`. */
export async function apiDeleteData<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await axiosClient.delete<DataEnvelope<T>>(url, config)
  return unwrapData<T>(data)
}

/**
 * POST multipart FormData returning a JsonResource: `{ data: T }` → `T`.
 * Omits the default JSON Content-Type so the runtime sets multipart + boundary.
 */
export async function apiPostFormData<T>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await axiosClient.post<DataEnvelope<T>>(url, formData, {
    ...config,
    headers: {
      ...config?.headers,
      // Axios: `false` drops the instance default `application/json`.
      'Content-Type': false as unknown as string,
    },
    transformRequest: [
      (body, headers) => {
        if (body instanceof FormData && headers) {
          // Ensure no stale JSON content-type survives merging/adapters.
          if (typeof headers.delete === 'function') {
            headers.delete('Content-Type')
          } else {
            delete (headers as Record<string, unknown>)['Content-Type']
            delete (headers as Record<string, unknown>)['content-type']
          }
        }
        return body
      },
    ],
  })
  return unwrapData<T>(data)
}
