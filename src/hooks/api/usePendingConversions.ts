import { listPendingConversions } from '../../api/conversions'
import type { LeaveConversionResource } from '../../api/types'
import { useAsyncResource, type AsyncResourceState } from './useAsyncResource'

/** Page → hook → `api/conversions` for GET /conversions/pending. */
export function usePendingConversions(): AsyncResourceState<
  LeaveConversionResource[]
> {
  return useAsyncResource(() => listPendingConversions(), [])
}
