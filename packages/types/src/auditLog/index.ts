import type { Domain } from '../domain/index.ts'

export interface AuditLogPositionSnapshot {
  id: string
  name: string
  abbreviation: string
  domains: Domain[]
  createdAt: string
}

export interface AuditLogUserSnapshot {
  id: string
  firstName: string
  middleName?: string
  lastName: string
  email: string
  positions: AuditLogPositionSnapshot[]
  createdAt: string
}

export type AuditLogTargetSnapshot =
  | { type: 'user'; data: AuditLogUserSnapshot }
  | { type: 'position'; data: AuditLogPositionSnapshot }

export interface AuditLogPerformerSnapshot {
  id: string
  firstName: string
  middleName?: string
  lastName: string
  email: string
}

export type AuditLogAction =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_DISABLED'
  | 'USER_POSITIONS_CHANGED'
  | 'USER_LOGIN_SUCCESS'
  | 'USER_LOGIN_FAILED'
  | 'USER_LOGOUT'
  | 'USER_PASSWORD_RESET_REQUESTED'
  | 'USER_PASSWORD_RESET_COMPLETED'
  | 'USER_SESSION_REVOKED'
  | 'POSITION_CREATED'
  | 'POSITION_UPDATED'
  | 'POSITION_DELETED'
  | 'POSITION_DOMAINS_CHANGED'

export interface AuditLog {
  id: string
  action: AuditLogAction
  target: AuditLogTargetSnapshot | null
  performer: AuditLogPerformerSnapshot | null
  timestamp: string
}
