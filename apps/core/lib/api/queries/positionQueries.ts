import type { ListPositionsInput, PaginatedResult, PositionDTO } from '@herald/types'
import { useQuery } from '@tanstack/react-query'

import { fetchPositions } from '@/lib/api/services/positionService'

export function usePositions(params: ListPositionsInput) {
  return useQuery<PaginatedResult<PositionDTO>>({
    queryKey: ['positions', params],
    queryFn: () => fetchPositions(params),
  })
}

// Shared "all positions" lookup used anywhere a full options list is needed
// (create forms, tables, drawers) instead of each call site re-declaring the
// same filters/pagination.
export function useAllPositionsOptions() {
  return usePositions({ filters: {}, pagination: { page: 1, limit: 200 } })
}
