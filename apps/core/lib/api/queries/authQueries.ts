import { HealthStatus } from '@herald/types'
import { useQuery } from '@tanstack/react-query'

import { get } from '@/lib/api/client'

export function useAuthHealth() {
  return useQuery<HealthStatus>({
    queryKey: ['auth', 'health'],
    queryFn: () => get<HealthStatus>('/health'),
    staleTime: 60 * 1000,
  })
}
