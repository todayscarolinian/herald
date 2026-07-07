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

function fetchPositionsPage(params: ListPositionsInput): Promise<PaginatedResult<PositionDTO>> {
  const searchParams = new URLSearchParams()

  // Add filters
  if (params.filters?.domains?.length) {
    searchParams.append('domains', params.filters.domains.join(','))
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

// The Firestore gateway caps every request to a small server-side page size
// (see MAX_PAGE_LIMIT in position-repository.gateway.ts) regardless of the
// requested limit. Keep fetching subsequent server pages until we've gathered
// as many items as the caller asked for, so callers can still request a large
// "page" for client-side pagination without silently getting truncated.
//
// The per-request limit must stay fixed across the follow-up calls: the
// gateway's cursor pagination derives each page's offset as
// (page - 1) * limit, so varying the limit between calls for the same
// listing would desync the offsets and return overlapping/skipped items.
export async function fetchPositions(
  params: ListPositionsInput
): Promise<PaginatedResult<PositionDTO>> {
  const targetCount = params.pagination.limit
  const startPage = params.pagination.page

  let page = startPage
  let latest = await fetchPositionsPage(params)
  const items = [...latest.items]

  while (latest.hasNextPage && items.length < targetCount) {
    page += 1
    latest = await fetchPositionsPage({ ...params, pagination: { page, limit: latest.limit } })
    items.push(...latest.items)
  }

  return { ...latest, items: items.slice(0, targetCount), page: startPage, limit: targetCount }
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
