import type { APIResponse, UpdateUserInput, UserDTO } from '@herald/types'
import { createFirebaseUserRepository } from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { getServerFirestore } from '@/lib/api/services/firebase/firestore/server'

async function verifySession(cookieHeader: string) {
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL
  const res = await fetch(`${authUrl}/auth/verify-session`, {
    headers: {
      cookie: cookieHeader,
      'x-herald-internal-api-key': process.env.HERALD_INTERNAL_API_KEY ?? '',
    },
  })
  if (!res.ok) {
    return null
  }
  const data = (await res.json()) as APIResponse<{ valid: boolean; user: { id: string } }>
  return data.success && data.data?.valid ? data.data.user : null
}

interface UpdateProfileRequestBody {
  firstName?: string
  middleName?: string
  lastName?: string
}

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const sessionUser = await verifySession(cookieHeader)

  if (!sessionUser) {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No valid session' } },
      { status: 401 }
    )
  }

  const userRepository = createFirebaseUserRepository(getServerFirestore())
  const currentUser = await userRepository.findById({ id: sessionUser.id })

  if (!currentUser) {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
      { status: 404 }
    )
  }

  return NextResponse.json<APIResponse<UserDTO>>(
    { success: true, data: currentUser },
    { status: 200 }
  )
}

export async function POST(request: NextRequest) {
  // 1. Verify session
  const cookieHeader = request.headers.get('cookie') ?? ''
  const sessionUser = await verifySession(cookieHeader)

  if (!sessionUser) {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No valid session' } },
      { status: 401 }
    )
  }

  // 2. Parse body
  let body: UpdateProfileRequestBody
  try {
    body = (await request.json()) as UpdateProfileRequestBody
  } catch {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      { status: 400 }
    )
  }

  if (!body.firstName || typeof body.firstName !== 'string' || body.firstName.trim() === '') {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'VALIDATION_ERROR', message: '"firstName" is required' } },
      { status: 422 }
    )
  }

  if (!body.lastName || typeof body.lastName !== 'string' || body.lastName.trim() === '') {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'VALIDATION_ERROR', message: '"lastName" is required' } },
      { status: 422 }
    )
  }

  // 3. Load current user, then update in place (positions/email passed through unchanged)
  try {
    const userRepository = createFirebaseUserRepository(getServerFirestore())
    const currentUser = await userRepository.findById({ id: sessionUser.id })

    if (!currentUser) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    const updateData: UpdateUserInput = {
      id: sessionUser.id,
      name: `${body.firstName} ${body.middleName || ''} ${body.lastName}`
        .replace(/\s+/g, ' ')
        .trim(),
      firstName: body.firstName,
      middleName: body.middleName || undefined,
      lastName: body.lastName,
      email: currentUser.email,
      positions: currentUser.positions.map((p) => p.id),
      updatedById: sessionUser.id,
    }

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
