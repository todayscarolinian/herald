import type {
  APIResponse,
  BulkCreatePositionRowInput,
  BulkPositionResult,
  BulkUpdatePositionRowInput,
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
  if (params.filters?.domains?.length) {
    searchParams.append('domains', params.filters.domains.join(','))
  }
  if (params.filters?.search) {
    searchParams.append('search', params.filters.search)
  }

  // Add pagination
  searchParams.append('page', String(params.pagination.page))
  searchParams.append('limit', String(params.pagination.limit))

  // Add sort if provided
  if (params.sort?.field) {
    searchParams.append('sortField', params.sort.field)
    searchParams.append('sortDirection', params.sort.direction)
  }

  return get<PaginatedResult<PositionDTO>>(`${ENDPOINTS.api.positions}?${searchParams.toString()}`)
}

export function createPosition(params: CreatePositionInput): Promise<APIResponse<PositionDTO>> {
  return post<APIResponse<PositionDTO>, CreatePositionInput>(ENDPOINTS.api.positions, params)
}

export function updatePosition(params: UpdatePositionInput): Promise<APIResponse<PositionDTO>> {
  return put<APIResponse<PositionDTO>, UpdatePositionInput>(
    `${ENDPOINTS.api.positions}/${params.id}`,
    params
  )
}

export function deletePosition(
  params: DeletePositionInput
): Promise<APIResponse<{ message: string }>> {
  return del<APIResponse<{ message: string }>, DeletePositionInput>(
    `${ENDPOINTS.api.positions}/${params.id}`,
    params
  )
}

export function bulkCreatePositions(params: {
  positions: BulkCreatePositionRowInput[]
}): Promise<APIResponse<BulkPositionResult>> {
  return post<APIResponse<BulkPositionResult>>(ENDPOINTS.api.positionsBulk, {
    mode: 'create',
    ...params,
  })
}

export function bulkUpdatePositions(params: {
  positions: BulkUpdatePositionRowInput[]
}): Promise<APIResponse<BulkPositionResult>> {
  return post<APIResponse<BulkPositionResult>>(ENDPOINTS.api.positionsBulk, {
    mode: 'update',
    ...params,
  })
}
