import type { ListPositionsInput, PaginatedResult, PositionDTO } from '@herald/types'
import { useQuery } from '@tanstack/react-query'

import { fetchPositions } from '@/lib/api/services/positionService'

export function usePositions(params: ListPositionsInput) {
  return useQuery<PaginatedResult<PositionDTO>>({
    queryKey: ['positions', params],
    queryFn: () => fetchPositions(params),
  })
}
