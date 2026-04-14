import type {
  AuditLogDTO,
  CreateAuditLogInput,
  GetAuditLogByIdInput,
  ListAuditLogsInput,
  TotalAuditLogsDTO,
} from '../dtos/auditLog.dto.ts'
import type { PaginatedResult } from '../dtos/common.dto.ts'
import type { UUID } from '../shared/uid.ts'

export interface IAuditLogRepository {
  findById(id: GetAuditLogByIdInput): Promise<AuditLogDTO | null>
  findAll(params: ListAuditLogsInput): Promise<PaginatedResult<AuditLogDTO>>

  create(input: CreateAuditLogInput): Promise<AuditLogDTO>

  getTotalCount(): Promise<TotalAuditLogsDTO>

  exists(id: UUID): Promise<boolean>
}
