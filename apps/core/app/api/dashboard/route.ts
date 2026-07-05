import type { APIResponse, DashboardStatsDTO } from '@herald/types'
import {
  createFirebaseAuditLogRepository,
  createFirebasePositionRepository,
  createFirebaseUserRepository,
} from '@herald/utils'
import { NextResponse } from 'next/server'

import { getServerFirestore } from '@/lib/api/services/firebase/firestore/server'

export async function GET(): Promise<NextResponse> {
  try {
    const firestore = getServerFirestore()
    const userRepository = createFirebaseUserRepository(firestore)
    const positionRepository = createFirebasePositionRepository(firestore)
    const auditLogRepository = createFirebaseAuditLogRepository(firestore)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalUsersResult,
      newUsersResult,
      unverifiedResult,
      totalPositionsResult,
      totalAuditLogsResult,
      logins30DaysResult,
      failedLogins24hResult,
      failedLoginsPrevious24hResult,
      recentActivityResult,
    ] = await Promise.all([
      userRepository.getTotalCount(),
      userRepository.findAll({
        filters: { createdAfter: startOfMonth.toISOString() },
        pagination: { page: 1, limit: 1 },
      }),
      userRepository.findAll({
        filters: { emailVerified: false },
        pagination: { page: 1, limit: 1 },
      }),
      positionRepository.getTotalCount(),
      auditLogRepository.getTotalCount(),
      auditLogRepository.findAll({
        filters: { action: 'USER_LOGIN_SUCCESS', since: thirtyDaysAgo.toISOString() },
        pagination: { page: 1, limit: 1 },
      }),
      auditLogRepository.findAll({
        filters: { action: 'USER_LOGIN_FAILED', since: oneDayAgo.toISOString() },
        pagination: { page: 1, limit: 1 },
      }),
      auditLogRepository.findAll({
        filters: {
          action: 'USER_LOGIN_FAILED',
          since: twoDaysAgo.toISOString(),
          until: oneDayAgo.toISOString(),
        },
        pagination: { page: 1, limit: 1 },
      }),
      auditLogRepository.findAll({ filters: {}, pagination: { page: 1, limit: 5 } }),
    ])

    const payload: DashboardStatsDTO = {
      totalUsers: totalUsersResult.totalUsers,
      newUsersThisMonth: newUsersResult.total,
      totalPositions: totalPositionsResult.totalPositions,
      totalAuditLogs: totalAuditLogsResult.totalAuditLogs,
      logins30Days: logins30DaysResult.total,
      failedLogins24h: failedLogins24hResult.total,
      failedLoginsPrevious24h: failedLoginsPrevious24hResult.total,
      unverifiedUsersCount: unverifiedResult.total,
      recentActivity: recentActivityResult.items,
    }

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}

function handleRouteError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'

  return NextResponse.json<APIResponse>(
    {
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
    },
    { status: 500 }
  )
}
