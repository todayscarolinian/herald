import type { AuditLogDTO, CreateAuditLogInput, IAuditLogRepository } from '@herald/types'

export interface CreateAuditLogDomainEvent {
  type: 'audit-log.create.requested'
  payload: CreateAuditLogInput
}

export async function dispatchCreateAuditLog(
  repository: IAuditLogRepository,
  event: CreateAuditLogDomainEvent
): Promise<AuditLogDTO> {
  if (event.type !== 'audit-log.create.requested') {
    throw new TypeError(`Unsupported audit log event type: ${event.type}`)
  }

  const createdAuditLog = await repository.create(event.payload)

  return createdAuditLog
}
