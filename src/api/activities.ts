import { apiGetList, type Paginated } from './axios-client'
import type { ActivityType, LeaveActivityResource } from './types'

export type ListActivitiesParams = {
  /** Leave type code filter, e.g. `VL`. */
  code?: string
  activity_type?: ActivityType
  /** Timestamp order — default API `desc` (newest first). */
  sort?: 'asc' | 'desc'
  per_page?: number
  page?: number
}

/** GET /activities — Activity Log for leaves where the viewer is on leave. */
export async function listActivities(
  params?: ListActivitiesParams,
): Promise<Paginated<LeaveActivityResource>> {
  return apiGetList<LeaveActivityResource>('/activities', { params })
}
