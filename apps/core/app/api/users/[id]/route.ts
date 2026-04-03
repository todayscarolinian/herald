import type { APIResponse } from '@herald/types'
import { createFirebaseUserRepository } from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { firestore } from '@/lib/firebase'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'BAD_REQUEST', message: 'User ID is required' } },
        { status: 400 }
      )
    }

    const userRepository = createFirebaseUserRepository(firestore)
    await userRepository.delete({ id, deletedBy: id })

    return NextResponse.json<APIResponse<{ message: string }>>(
      { success: true, data: { message: `User ${id} has been deleted` } },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    const isNotFound = message.includes('not found')

    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: {
          code: isNotFound ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message,
        },
      },
      { status: isNotFound ? 404 : 500 }
    )
  }
}
