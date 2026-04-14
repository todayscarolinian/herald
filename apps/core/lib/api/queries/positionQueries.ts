import type { ListPositionInput, PaginatedResult, PositionDTO } from '@herald/types'
import { useQuery } from '@tanstack/react-query'

import { fetchPositions } from '@/lib/api/services/positionService'

export function usePositions(params: ListPositionInput) {
  return useQuery<PaginatedResult<PositionDTO>>({
    queryKey: ['positions', params],
    queryFn: () => fetchPositions(params),
  })
}
