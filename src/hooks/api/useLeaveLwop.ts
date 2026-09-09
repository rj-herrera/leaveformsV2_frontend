import useSWR from 'swr'
import { getLeaveLwop } from '../../api/leaves'
import type { LeaveLwopParams } from '../../api/types'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/leaves` for GET /leaves/lwop. */
export function useLeaveLwop(params?: LeaveLwopParams) {
  return useSWR(swrKeys.leaveLwop(params), () => getLeaveLwop(params))
}
