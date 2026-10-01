import { axiosClient } from './axios-client'
import { clearCookie } from '../utils/cookies'

/** Group nest on `/me` (`group` and `role.pic_groups[]`). */
export type MeGroupRef = {
  id: number
  abbreviation: string | null
  name: string | null
}

export type MeDesignationRef = {
  id: number
  acronym: string | null
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
  /** `employee_list.gender`: `0` male, `1` female, or null. */
  gender: number | null
  group_id: number | null
  group: MeGroupRef | null
  date_hired: string | null
  role: MeRole
  designation: MeDesignationRef | null
}

/** Current employee from the portal userID cookie. */
export async function fetchCurrentUser(): Promise<MeResponse> {
  const { data } = await axiosClient.get<MeResponse>('/me')
  return data
}

/**
 * Drop the portal cookie and follow the API 401 `login_url`
 * (KDTPortalLogin).
 */
export async function redirectToPortalLogin(): Promise<void> {
  clearCookie('userID')
  try {
    await fetchCurrentUser()
  } catch {
    // The 401 interceptor sends the browser to login_url.
  }
}
