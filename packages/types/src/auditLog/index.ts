export interface AuditLog {
  id: string
  action: string
  targetId: string
  performerId: string
  timestamp: string
}
