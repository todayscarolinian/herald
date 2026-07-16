import type { APIResponse } from '@herald/types'
import { createFirebaseUserRepository } from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { hasHeraldWriteAccess, verifySessionFromCookie } from '@/lib/api/auth/verify-session'
import { post } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
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

    const userRepository = createFirebaseUserRepository(getServerFirestore())
    const user = await userRepository.findById({ id })

    if (!user) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: { code: 'ALREADY_VERIFIED', message: 'This user’s email is already verified' },
        },
        { status: 409 }
      )
    }

    const result = await post<APIResponse<{ message: string }>>(
      ENDPOINTS.auth.sendVerificationEmail,
      { email: user.email }
    )

    if (!result.success) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            code: result.error?.code || 'SEND_FAILED',
            message: result.error?.message || 'Failed to send verification email',
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json<APIResponse<{ message: string }>>(
      { success: true, data: { message: 'Verification email sent' } },
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
