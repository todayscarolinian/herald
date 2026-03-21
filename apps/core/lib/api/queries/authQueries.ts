import { HealthStatus } from '@herald/types'
import { useQuery } from '@tanstack/react-query'

import { get } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export function useAuthHealth() {
  return useQuery<HealthStatus>({
    queryKey: ['auth', 'health'],
    queryFn: () => get<HealthStatus>(ENDPOINTS.health),
    staleTime: 60 * 1000,
  })
}
