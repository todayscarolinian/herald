import type {
  ListPositionsInput,
  PaginatedResult,
  PositionDTO,
  PositionFilters,
  PositionSortField,
  SortInput,
} from '@herald/types'
import { DEFAULT_PAGINATION } from '@herald/types'
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { fetchPositions } from '@/lib/api/services/positionService'

// Server round-trip batch size for windowed pagination. Independent of the
// table's own "rows per page" — the client accumulates batches of this size
// and only requests the next one once the requested table page needs more
// items than are already cached.
export const POSITIONS_SERVER_BATCH_SIZE = DEFAULT_PAGINATION.limit

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

interface UsePositionsInfiniteParams {
  filters: PositionFilters
  sort?: SortInput<PositionSortField>
}

export function usePositionsInfinite({ filters, sort }: UsePositionsInfiniteParams) {
  return useInfiniteQuery({
    queryKey: ['positions', 'infinite', filters, sort],
    queryFn: ({ pageParam }) =>
      fetchPositions({
        filters,
        pagination: { page: pageParam, limit: POSITIONS_SERVER_BATCH_SIZE },
        sort,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    placeholderData: keepPreviousData,
  })
}
