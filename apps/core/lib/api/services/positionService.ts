import type {
  APIResponse,
  CreatePositionInput,
  DeletePositionInput,
  ListPositionsInput,
  PaginatedResult,
  PositionDTO,
  UpdatePositionInput,
} from '@herald/types'

import { del, get, post, put } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export function fetchPositions(params: ListPositionsInput): Promise<PaginatedResult<PositionDTO>> {
  const searchParams = new URLSearchParams()

  // Add filters
  if (params.filters?.permissions?.length) {
    searchParams.append('permissions', params.filters.permissions.join(','))
  }

  // Add pagination
  searchParams.append('page', String(params.pagination.page))
  searchParams.append('limit', String(params.pagination.limit))

  // Add sort if provided
  if (params.sort?.field) {
    searchParams.append('sortField', params.sort.field)
    searchParams.append('sortDirection', params.sort.direction)
  }

  return get<PaginatedResult<PositionDTO>>(`${ENDPOINTS.positions}?${searchParams.toString()}`)
}

export function createPosition(params: CreatePositionInput): Promise<APIResponse<PositionDTO>> {
  return post<APIResponse<PositionDTO>, CreatePositionInput>('/api/positions', params)
}

export function updatePosition(params: UpdatePositionInput): Promise<APIResponse<PositionDTO>> {
  return put<APIResponse<PositionDTO>, UpdatePositionInput>(`/api/positions/${params.id}`, params)
}

export function deletePosition(
  params: DeletePositionInput
): Promise<APIResponse<{ message: string }>> {
  return del<APIResponse<{ message: string }>>(`/api/positions/${params.id}`)
}
