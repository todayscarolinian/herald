import { APIResponse, HealthResponse } from '@herald/types'
import { useQuery } from '@tanstack/react-query'

import { get } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export function useAuthHealth() {
  return useQuery<APIResponse<HealthResponse>>({
    queryKey: ['auth', 'health'],
    queryFn: () => get<APIResponse<HealthResponse>>(ENDPOINTS.health),
    staleTime: 60 * 1000,
  })
}
