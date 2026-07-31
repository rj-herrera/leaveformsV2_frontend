import useSWR from 'swr'
import { listPendingConversions } from '../../api/conversions'
import { swrKeys } from './swrKeys'

/** Page → hook → `api/conversions` for GET /conversions/pending. */
export function usePendingConversions() {
  return useSWR(swrKeys.pendingConversions, listPendingConversions)
}
