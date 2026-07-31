import { axiosClient } from './axios-client'

export type DevLoginResponse = {
  userID: string
  cookie: string
}

export type MeRole = {
  approval_level: number | null
  is_president: boolean
  is_admin: boolean
  pic_groups: string[]
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
  role: MeRole
}

/** Local-only: resolve emp_id → portal userID hash (frontend sets the cookie). */
export async function loginWithEmployeeId(
  empId: number,
): Promise<DevLoginResponse> {
  const { data } = await axiosClient.post<DevLoginResponse>('/dev/login', {
    emp_id: empId,
  })
  return data
}

/** Current employee from the portal userID cookie. */
export async function fetchCurrentUser(): Promise<MeResponse> {
  const { data } = await axiosClient.get<MeResponse>('/me')
  return data
}
