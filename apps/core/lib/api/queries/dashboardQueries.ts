import type { DashboardStatsDTO } from '@herald/types'
import { useQuery } from '@tanstack/react-query'

import { fetchDashboardStats } from '@/lib/api/services/dashboardService'

const DASHBOARD_STATS_QUERY_KEY = ['dashboard-stats']

export function useDashboardStats() {
  return useQuery<DashboardStatsDTO>({
    queryKey: DASHBOARD_STATS_QUERY_KEY,
    queryFn: fetchDashboardStats,
    staleTime: 15 * 60 * 1000,
  })
}
