import type { APIResponse, UpdateUserInput, UserDTO } from '@herald/types'
import { createFirebaseUserRepository } from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { firestore } from '@/lib/firebase'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'BAD_REQUEST', message: 'User ID is required' } },
        { status: 400 }
      )
    }

    const body = (await request.json()) as Partial<UpdateUserInput>

    if (!body.firstName || !body.lastName || !body.email || !body.password || !body.positions) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Missing required fields: firstName, lastName, email, password, positions',
          },
        },
        { status: 400 }
      )
    }

    const updateData: UpdateUserInput = {
      id,
      firstName: body.firstName,
      middleName: body.middleName,
      lastName: body.lastName,
      email: body.email,
      password: body.password,
      positions: body.positions,
    }

    const userRepository = createFirebaseUserRepository(firestore)
    const updatedUser = await userRepository.update(updateData)

    return NextResponse.json<APIResponse<UserDTO>>(
      { success: true, data: updatedUser },
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
