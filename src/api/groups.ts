import { apiGetList } from './axios-client'

/** Slim row from GET /groups/{group}/members. */
export type GroupMember = {
  id: number
  name: string
  /** `employee_list.gender`: `0` male, `1` female, or null. */
  gender: number | null
}

/** GET /groups/{group}/members — employees this PIC may file leave for. */
export async function listGroupMembers(
  groupId: number,
): Promise<GroupMember[]> {
  const { data } = await apiGetList<GroupMember>(
    `/groups/${groupId}/members`,
  )
  return data
}

/** GET /p4-members — active P4 employees the president may file leave for. */
export async function listP4Members(): Promise<GroupMember[]> {
  const { data } = await apiGetList<GroupMember>('/p4-members')
  return data
}
