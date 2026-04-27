/**
 * Audit log-related data transfer objects (DTOs) and interfaces.
 *
 * This file defines the structure of audit log-related data that is transferred between different layers of the application, such as the domain layer, application layer, and infrastructure layer. It includes the AuditLog interface, which represents the essential information about an audit log entry.
 *
 * The purpose of these DTOs is to provide a consistent and standardized way of handling data transfer across different parts of the application, ensuring that the data being transferred adheres to the expected structure and format.
 */

import type { AuditLog } from '../auditLog/index.ts'
import type { UUID } from '../shared/uid.ts'
import type { PaginatedResult, PaginationInput, SortInput } from './common.dto.ts'

// =============================================================================
// INPUT DTOs
// =============================================================================

/**
 * Input for creating a new audit log entry.
 */

export type CreateAuditLogInput = Omit<AuditLog, 'id' | 'timestamp'>

export interface GetAuditLogByIdInput {
  id: UUID
}

export interface ListAuditLogsInput {
  filters: AuditLogFilters
  pagination: PaginationInput
  sort?: SortInput<AuditLogSortField>
}

export interface AuditLogFilters {
  action?: string
  targetId?: UUID
  performerId?: UUID
}

export type AuditLogSortField = 'action' | 'targetId' | 'performerId' | 'timestamp'

// =============================================================================
// OUTPUT DTOs
// =============================================================================

export type AuditLogDTO = AuditLog

export type AuditLogListDTO = PaginatedResult<AuditLogDTO>

export interface TotalAuditLogsDTO {
  totalAuditLogs: number
}
