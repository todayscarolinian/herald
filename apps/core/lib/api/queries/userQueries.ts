import type { ListUsersInput, PaginatedResult, UserDTO } from '@herald/types'
import { useQuery } from '@tanstack/react-query'

import { fetchUsers } from '@/lib/api/services/userService'

export function useUsers(params: ListUsersInput) {
  return useQuery<PaginatedResult<UserDTO>>({
    queryKey: ['users', params],
    queryFn: () => fetchUsers(params),
  })
}
