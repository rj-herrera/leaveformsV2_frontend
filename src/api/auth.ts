import { axiosClient } from './axios-client'

export type DevLoginResponse = {
  userID: string
  cookie: string
}

/** Group nest on `/me` (`group` and `role.pic_groups[]`). */
export type MeGroupRef = {
  id: number
  abbreviation: string | null
  name: string | null
}

export type MeRole = {
  approval_level: number | null
  is_president: boolean
  is_admin: boolean
  pic_groups: MeGroupRef[]
}

export type MeResponse = {
  id: number
  firstname: string
  surname: string
  full_name: string
  email: string | null
  username: string | null
  group_id: number | null
  group: MeGroupRef | null
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
