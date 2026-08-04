import useSWR from 'swr'
import { getLeave } from '../../api/leaves'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/leaves` for GET /leaves/{id}. */
export function useLeaveDetail(leaveId: number | null) {
  return useSWR(
    leaveId != null && leaveId > 0 ? swrKeys.leave(leaveId) : null,
    () => getLeave(leaveId!),
  )
}
