import type { AuditLog } from '../auditLog/index.ts'
import type { PaginatedResult, PaginationInput, SortInput } from './common.dto.ts'

// =============================================================================
// INPUT DTOs
// =============================================================================

export type CreateAuditLogInput = Omit<AuditLog, 'id' | 'timestamp'>

export interface GetAuditLogByIdInput {
  id: string
}

export interface ListAuditLogsInput {
  filters: AuditLogFilters
  pagination: PaginationInput
  sort?: SortInput<AuditLogSortField>
}

export interface AuditLogFilters {
  action?: string
  since?: string
  until?: string
  search?: string
}

export type AuditLogSortField = 'action' | 'timestamp'

// =============================================================================
// OUTPUT DTOs
// =============================================================================

export type AuditLogDTO = AuditLog

export type AuditLogListDTO = PaginatedResult<AuditLogDTO>

export interface TotalAuditLogsDTO {
  totalAuditLogs: number
}
