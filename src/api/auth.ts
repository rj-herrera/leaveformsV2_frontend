import { apiRequest } from './client'

export type DevLoginResponse = {
  userID: string
  cookie: string
}

export type MeResponse = {
  id: number
  firstname: string
  surname: string
  full_name: string
  email: string | null
  username: string | null
  group_id: number | null
  group: {
    id: number
    abbreviation: string | null
    name: string | null
  } | null
  date_hired: string | null
}

/** Local-only: resolve emp_id → portal userID hash (frontend sets the cookie). */
export function loginWithEmployeeId(empId: number): Promise<DevLoginResponse> {
  return apiRequest<DevLoginResponse>('/api/dev/login', {
    method: 'POST',
    body: { emp_id: empId },
  })
}

/** Current employee from the portal userID cookie. */
export function fetchCurrentUser(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/api/me')
}
