import type { AuditLogDTO, ListAuditLogsInput, PaginatedResult } from '@herald/types'

import { get } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

function fetchAuditLogsPage(params: ListAuditLogsInput): Promise<PaginatedResult<AuditLogDTO>> {
  const searchParams = new URLSearchParams()

  if (params.filters?.action) {
    searchParams.append('action', params.filters.action)
  }

  searchParams.append('page', String(params.pagination.page))
  searchParams.append('limit', String(params.pagination.limit))

  if (params.sort?.field) {
    searchParams.append('sortField', params.sort.field)
    searchParams.append('sortDirection', params.sort.direction)
  }

  return get<PaginatedResult<AuditLogDTO>>(`${ENDPOINTS.api.auditLogs}?${searchParams.toString()}`)
}

// The Firestore gateway caps every request to a small server-side page size
// (see MAX_PAGE_LIMIT in auditLog-repository.gateway.ts) regardless of the
// requested limit. Keep fetching subsequent server pages until we've gathered
// as many items as the caller asked for, so callers can still request a large
// "page" for client-side pagination without silently getting truncated.
//
// The per-request limit must stay fixed across the follow-up calls: the
// gateway's cursor pagination derives each page's offset as
// (page - 1) * limit, so varying the limit between calls for the same
// listing would desync the offsets and return overlapping/skipped items.
export async function fetchAuditLogs(
  params: ListAuditLogsInput
): Promise<PaginatedResult<AuditLogDTO>> {
  const targetCount = params.pagination.limit
  const startPage = params.pagination.page

  let page = startPage
  let latest = await fetchAuditLogsPage(params)
  const items = [...latest.items]

  while (latest.hasNextPage && items.length < targetCount) {
    page += 1
    latest = await fetchAuditLogsPage({ ...params, pagination: { page, limit: latest.limit } })
    items.push(...latest.items)
  }

  return { ...latest, items: items.slice(0, targetCount), page: startPage, limit: targetCount }
}
