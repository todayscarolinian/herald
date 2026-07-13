import type {
  AuditLogDTO,
  AuditLogFilters,
  AuditLogSortField,
  ListAuditLogsInput,
  PaginatedResult,
  SortInput,
} from '@herald/types'
import { DEFAULT_PAGINATION } from '@herald/types'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { fetchAuditLogs } from '@/lib/api/services/auditLogService'

// Server round-trip batch size for windowed pagination. Independent of the
// table's own "rows per page" — the client accumulates batches of this size
// and only requests the next one once the requested table page needs more
// items than are already cached.
export const AUDIT_LOGS_SERVER_BATCH_SIZE = DEFAULT_PAGINATION.limit

export function useAuditLogs(params: ListAuditLogsInput) {
  return useQuery<PaginatedResult<AuditLogDTO>>({
    queryKey: ['audit-logs', params],
    queryFn: () => fetchAuditLogs(params),
  })
}

interface UseAuditLogsInfiniteParams {
  filters: AuditLogFilters
  sort?: SortInput<AuditLogSortField>
}

export function useAuditLogsInfinite({ filters, sort }: UseAuditLogsInfiniteParams) {
  return useInfiniteQuery({
    queryKey: ['audit-logs', 'infinite', filters, sort],
    queryFn: ({ pageParam }) =>
      fetchAuditLogs({
        filters,
        pagination: { page: pageParam, limit: AUDIT_LOGS_SERVER_BATCH_SIZE },
        sort,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
  })
}
