import type {
  AuditLog,
  AuditLogPerformerSnapshot,
  AuditLogPositionSnapshot,
  AuditLogTargetSnapshot,
  AuditLogUserSnapshot,
} from '../auditLog/index.ts'
import type { PaginatedResult, PaginationInput, SortInput } from './common.dto.ts'

// =============================================================================
// SNAPSHOT TYPE ALIASES (preserved for backward-compat with existing consumers)
// =============================================================================

export type AuditLogTargetUserDTO = AuditLogUserSnapshot
export type AuditLogTargetPositionDTO = AuditLogPositionSnapshot
export type AuditLogTargetDTO = AuditLogTargetSnapshot
export type AuditLogPerformerDTO = AuditLogPerformerSnapshot

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
