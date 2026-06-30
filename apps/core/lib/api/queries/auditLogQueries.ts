import type { AuditLogDTO, ListAuditLogsInput, PaginatedResult } from '@herald/types'
import { useQuery } from '@tanstack/react-query'

import { fetchAuditLogs } from '@/lib/api/services/auditLogService'

export function useAuditLogs(params: ListAuditLogsInput) {
  return useQuery<PaginatedResult<AuditLogDTO>>({
    queryKey: ['audit-logs', params],
    queryFn: () => fetchAuditLogs(params),
  })
}
