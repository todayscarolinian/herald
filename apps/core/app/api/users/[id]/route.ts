import type { APIResponse, DeleteUserInput, UpdateUserInput, UserDTO } from '@herald/types'
import { createFirebaseUserRepository } from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { hasHeraldWriteAccess, verifySessionFromCookie } from '@/lib/api/auth/verify-session'
import { getServerFirestore } from '@/lib/api/services/firebase/firestore/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieHeader = request.headers.get('cookie') ?? ''
    const sessionUser = await verifySessionFromCookie(cookieHeader)
    if (!sessionUser) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'No valid session' } },
        { status: 401 }
      )
    }
    if (!hasHeraldWriteAccess(sessionUser.domains)) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'FORBIDDEN', message: 'TC Herald access required' } },
        { status: 403 }
      )
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'BAD_REQUEST', message: 'User ID is required' } },
        { status: 400 }
      )
    }

    const disableData: DeleteUserInput = { id }

    const userRepository = createFirebaseUserRepository(getServerFirestore())
    await userRepository.disable(disableData, sessionUser.id)

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieHeader = request.headers.get('cookie') ?? ''
    const sessionUser = await verifySessionFromCookie(cookieHeader)
    if (!sessionUser) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'No valid session' } },
        { status: 401 }
      )
    }
    if (!hasHeraldWriteAccess(sessionUser.domains)) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'FORBIDDEN', message: 'TC Herald access required' } },
        { status: 403 }
      )
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'BAD_REQUEST', message: 'User ID is required' } },
        { status: 400 }
      )
    }

    const body = (await request.json()) as Partial<UpdateUserInput>

    if (!body.firstName || !body.lastName || !body.email || !body.positions) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Missing required fields: firstName, lastName, email, positions',
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
      name: `${body.firstName} ${body.middleName || ''} ${body.lastName}`,
      firstName: body.firstName,
      middleName: body.middleName,
      lastName: body.lastName,
      email: body.email,
      positions: body.positions,
    }

    const userRepository = createFirebaseUserRepository(getServerFirestore())
    const updatedUser = await userRepository.update(updateData, sessionUser.id)

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = request.headers.get('cookie') ?? ''
    const sessionUser = await verifySessionFromCookie(cookieHeader)
    if (!sessionUser) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'No valid session' } },
        { status: 401 }
      )
    }
    if (!hasHeraldWriteAccess(sessionUser.domains)) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'FORBIDDEN', message: 'TC Herald access required' } },
        { status: 403 }
      )
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'BAD_REQUEST', message: 'User ID is required' } },
        { status: 400 }
      )
    }

    const userRepository = createFirebaseUserRepository(getServerFirestore())
    await userRepository.delete({ id }, sessionUser.id)

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
