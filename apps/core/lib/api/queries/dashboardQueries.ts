import type { DashboardStatsDTO } from '@herald/types'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { fetchDashboardStats } from '@/lib/api/services/dashboardService'

const DASHBOARD_STATS_QUERY_KEY = ['dashboard-stats']
const STORAGE_KEY = 'herald:dashboard-stats:v1'

type StoredDashboardStats = {
  data: DashboardStatsDTO
  fetchedAt: number
}

function readStoredDashboardStats(): StoredDashboardStats | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<StoredDashboardStats>
    if (!parsed.data || typeof parsed.fetchedAt !== 'number') {
      return null
    }

    return { data: parsed.data, fetchedAt: parsed.fetchedAt }
  } catch {
    return null
  }
}

function writeStoredDashboardStats(data: DashboardStatsDTO): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const payload: StoredDashboardStats = { data, fetchedAt: Date.now() }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // localStorage unavailable or full -- caching is a convenience, not required
  }
}

/**
 * Seeds from a persisted localStorage snapshot (if any) so the dashboard
 * renders instantly without hitting the API on every visit, and only fetches
 * when there's no snapshot yet or the caller explicitly calls `refetch()` --
 * this is intentionally not a live/polling query, see the dashboard page's
 * refresh button for the manual-refresh entry point.
 */
export function useDashboardStats() {
  const query = useQuery<DashboardStatsDTO>({
    queryKey: DASHBOARD_STATS_QUERY_KEY,
    queryFn: fetchDashboardStats,
    initialData: () => readStoredDashboardStats()?.data,
    initialDataUpdatedAt: () => readStoredDashboardStats()?.fetchedAt,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  useEffect(() => {
    if (query.data) {
      writeStoredDashboardStats(query.data)
    }
  }, [query.data])

  return query
}
