import type { APIResponse, UpdateUserInput, UserDTO } from '@herald/types'
import {
  createFirebaseUserRepository,
  isValidPassword,
  PASSWORD_STRENGTH_REQUIREMENTS,
} from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { getServerFirestore } from '@/lib/api/services/firebase/firestore/server'

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

    if (!body.firstName || typeof body.firstName !== 'string') {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '"firstName" is required' } },
        { status: 422 }
      )
    }

    if (!body.lastName || typeof body.lastName !== 'string') {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '"lastName" is required' } },
        { status: 422 }
      )
    }

    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '"email" is required' } },
        { status: 422 }
      )
    }

    if (!body.password || typeof body.password !== 'string' || !isValidPassword(body.password)) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `"password" is required. ${PASSWORD_STRENGTH_REQUIREMENTS}`,
          },
        },
        { status: 422 }
      )
    }

    if (!Array.isArray(body.positions)) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '"positions" must be an array' },
        },
        { status: 422 }
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

    const userRepository = createFirebaseUserRepository(getServerFirestore())
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
