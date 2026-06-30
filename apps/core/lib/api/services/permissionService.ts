import type { ListPermissionsInput, PaginatedResult, PermissionDTO } from '@herald/types'

import { get } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export function fetchPermissions(
  params: ListPermissionsInput
): Promise<PaginatedResult<PermissionDTO>> {
  const searchParams = new URLSearchParams()

  if (params.filters?.domain) {
    searchParams.append('domain', params.filters.domain)
  }

  searchParams.append('page', String(params.pagination.page))
  searchParams.append('limit', String(params.pagination.limit))

  if (params.sort?.field) {
    searchParams.append('sortField', params.sort.field)
    searchParams.append('sortDirection', params.sort.direction)
  }

  return get<PaginatedResult<PermissionDTO>>(
    `${ENDPOINTS.api.permissions}?${searchParams.toString()}`
  )
}
