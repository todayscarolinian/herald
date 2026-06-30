import type { APIResponse, PermissionDTO } from '@herald/types'
import { createFirebasePermissionRepository } from '@herald/utils'
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
        { success: false, error: { code: 'BAD_REQUEST', message: 'Permission ID is required' } },
        { status: 400 }
      )
    }

    const repository = createFirebasePermissionRepository(getServerFirestore())
    const permission = await repository.findById({ id })

    if (!permission) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'NOT_FOUND', message: `Permission ${id} not found` } },
        { status: 404 }
      )
    }

    return NextResponse.json<APIResponse<PermissionDTO>>(
      { success: true, data: permission },
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
