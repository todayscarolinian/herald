import type { AuditLogDTO, ListAuditLogsInput, PaginatedResult } from '@herald/types'

import { get } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export function fetchAuditLogs(params: ListAuditLogsInput): Promise<PaginatedResult<AuditLogDTO>> {
  const searchParams = new URLSearchParams()

  if (params.filters?.action) {
    searchParams.append('action', params.filters.action)
  }
  if (params.filters?.search) {
    searchParams.append('search', params.filters.search)
  }

  searchParams.append('page', String(params.pagination.page))
  searchParams.append('limit', String(params.pagination.limit))

  if (params.sort?.field) {
    searchParams.append('sortField', params.sort.field)
    searchParams.append('sortDirection', params.sort.direction)
  }

  return get<PaginatedResult<AuditLogDTO>>(`${ENDPOINTS.api.auditLogs}?${searchParams.toString()}`)
}
