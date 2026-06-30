import type { APIResponse, AuditLogDTO } from '@herald/types'
import { createFirebaseAuditLogRepository } from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { getServerFirestore } from '@/lib/api/services/firebase/firestore/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Audit log ID is required' } },
        { status: 400 }
      )
    }

    const repository = createFirebaseAuditLogRepository(getServerFirestore())
    const auditLog = await repository.findById({ id })

    if (!auditLog) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'NOT_FOUND', message: `Audit log ${id} not found` } },
        { status: 404 }
      )
    }

    return NextResponse.json<APIResponse<AuditLogDTO>>(
      { success: true, data: auditLog },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'

    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    )
  }
}
