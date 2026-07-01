/**
 * Dashboard-related data transfer objects (DTOs).
 *
 * Defines the shape of the aggregated statistics payload served by the
 * dashboard summary endpoint. This DTO intentionally has no INPUT section --
 * the dashboard endpoint takes no filters/pagination, it always returns the
 * full current snapshot.
 */

import type { AuditLogDTO } from './auditLog.dto.ts'

// =============================================================================
// OUTPUT DTOs
// =============================================================================

export interface DashboardStatsDTO {
  totalUsers: number
  newUsersThisMonth: number
  totalPositions: number
  totalPermissions: number
  totalAuditLogs: number
  logins30Days: number
  failedLogins24h: number
  failedLoginsPrevious24h: number
  unverifiedUsersCount: number
  recentActivity: AuditLogDTO[]
}
