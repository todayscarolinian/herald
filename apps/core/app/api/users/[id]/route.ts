import type { APIResponse, DeleteUserInput } from '@herald/types'
import { createFirebaseUserRepository } from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { firestore } from '@/lib/firebase'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'BAD_REQUEST', message: 'User ID is required' } },
        { status: 400 }
      )
    }

    const body = (await request.json()) as Partial<DeleteUserInput>

    const disableData: DeleteUserInput = {
      id,
      deletedBy: body.deletedBy ?? id,
    }

    const userRepository = createFirebaseUserRepository(firestore)
    await userRepository.disable(disableData)

    return NextResponse.json<APIResponse<{ message: string }>>(
      { success: true, data: { message: `User ${id} has been disabled` } },
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
