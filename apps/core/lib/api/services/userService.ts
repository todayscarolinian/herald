import type { ListUsersInput, PaginatedResult, UserDTO } from '@herald/types'

import { get } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export function fetchUsers(params: ListUsersInput): Promise<PaginatedResult<UserDTO>> {
  const searchParams = new URLSearchParams()

  // Add filters
  if (params.filters?.positionId) {
    searchParams.append('positionId', params.filters.positionId)
  }
  if (params.filters?.positionIds?.length) {
    searchParams.append('positionIds', params.filters.positionIds.join(','))
  }
  if (params.filters?.permissions?.length) {
    searchParams.append('permissions', params.filters.permissions.join(','))
  }
  if (params.filters?.disabled !== undefined) {
    searchParams.append('disabled', String(params.filters.disabled))
  }
  if (params.filters?.emailVerified !== undefined) {
    searchParams.append('emailVerified', String(params.filters.emailVerified))
  }

  // Add pagination
  searchParams.append('page', String(params.pagination.page))
  searchParams.append('limit', String(params.pagination.limit))

  // Add sort if provided
  if (params.sort?.field) {
    searchParams.append('sortField', params.sort.field)
    searchParams.append('sortDirection', params.sort.direction)
  }

  return get<PaginatedResult<UserDTO>>(`${ENDPOINTS.users}?${searchParams.toString()}`)
}
