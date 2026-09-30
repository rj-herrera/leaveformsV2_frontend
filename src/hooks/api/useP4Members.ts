import useSWR from 'swr'
import { listP4Members } from '../../api/groups'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/groups` for GET /p4-members. */
export function useP4Members(enabled: boolean) {
  return useSWR(enabled ? swrKeys.p4Members : null, () => listP4Members())
}
