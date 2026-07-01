import type { APIResponse, ListUsersInput, PaginatedResult, UserDTO } from '@herald/types'
import { useQuery } from '@tanstack/react-query'

import { fetchMyProfile, fetchUsers } from '@/lib/api/services/userService'

export function useUsers(params: ListUsersInput) {
  return useQuery<PaginatedResult<UserDTO>>({
    queryKey: ['users', params],
    queryFn: () => fetchUsers(params),
  })
}

export function useMyProfile() {
  return useQuery<APIResponse<UserDTO>>({
    queryKey: ['myProfile'],
    queryFn: fetchMyProfile,
  })
}
