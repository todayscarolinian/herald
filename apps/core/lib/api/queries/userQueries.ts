import type { APIResponse, SortInput, UserDTO, UserFilters, UserSortField } from '@herald/types'
import { DEFAULT_PAGINATION } from '@herald/types'
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { fetchMyProfile, fetchUsers } from '@/lib/api/services/userService'

// Server round-trip batch size for windowed pagination. Independent of the
// table's own "rows per page" — the client accumulates batches of this size
// and only requests the next one once the requested table page needs more
// items than are already cached.
export const USERS_SERVER_BATCH_SIZE = DEFAULT_PAGINATION.limit

export function useMyProfile() {
  return useQuery<APIResponse<UserDTO>>({
    queryKey: ['myProfile'],
    queryFn: fetchMyProfile,
    staleTime: 60 * 1000,
  })
}

interface UseUsersInfiniteParams {
  filters: UserFilters
  sort?: SortInput<UserSortField>
}

export function useUsersInfinite({ filters, sort }: UseUsersInfiniteParams) {
  return useInfiniteQuery({
    queryKey: ['users', 'infinite', filters, sort],
    queryFn: ({ pageParam }) =>
      fetchUsers({
        filters,
        pagination: { page: pageParam, limit: USERS_SERVER_BATCH_SIZE },
        sort,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    placeholderData: keepPreviousData,
  })
}
