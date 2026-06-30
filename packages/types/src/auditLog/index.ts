export interface AuditLogPositionSnapshot {
  id: string
  name: string
  abbreviation: string
  permissions: string[]
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

export interface AuditLog {
  id: string
  action: string
  target: AuditLogTargetSnapshot | null
  performer: AuditLogPerformerSnapshot | null
  timestamp: string
}
