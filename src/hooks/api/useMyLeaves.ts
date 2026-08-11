import useSWR from 'swr'
import {
  listMyLeaves,
  type ListMyLeavesParams,
} from '../../api/leaves'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/leaves` for GET /leaves. */
export function useMyLeaves(params?: ListMyLeavesParams) {
  return useSWR(swrKeys.leaves(params), () => listMyLeaves(params))
}
