import useSWR from 'swr'
import { listGroupMembers } from '../../api/groups'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/groups` for GET /groups/{id}/members. */
export function useGroupMembers(groupId: number | null) {
  return useSWR(
    groupId != null ? swrKeys.groupMembers(groupId) : null,
    ([, id]: readonly ['group-members', number]) => listGroupMembers(id),
  )
}
