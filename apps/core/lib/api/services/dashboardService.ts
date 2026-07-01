import type { DashboardStatsDTO } from '@herald/types'

import { get } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export function fetchDashboardStats(): Promise<DashboardStatsDTO> {
  return get<DashboardStatsDTO>(ENDPOINTS.api.dashboard)
}
