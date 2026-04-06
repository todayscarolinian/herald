import type { APIResponse, CreateUserInput, UserDTO } from '@herald/types'
import { createFirebaseUserRepository, PASSWORD_STRENGTH_REQUIREMENTS } from '@herald/utils'
import { getApps, initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

import { sendWelcomeEmail, signUpInBetterAuth } from '@/lib/api/services/userService'

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
}

const clientApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!

const clientFirestore = getFirestore(clientApp)

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      { status: 400 }
    )
  }

  const { firstName, middleName, lastName, email, password, positions } =
    (body as Partial<CreateUserInput & { password: string }>) ?? {}

  if (!firstName || typeof firstName !== 'string') {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'VALIDATION_ERROR', message: '"firstName" is required' } },
      { status: 422 }
    )
  }

  if (!lastName || typeof lastName !== 'string') {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'VALIDATION_ERROR', message: '"lastName" is required' } },
      { status: 422 }
    )
  }

  if (!email || typeof email !== 'string') {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'VALIDATION_ERROR', message: '"email" is required' } },
      { status: 422 }
    )
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '"password" is required and must be at least 6 characters',
        },
      },
      { status: 422 }
    )
  }

  if (!Array.isArray(positions)) {
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '"positions" must be an array' },
      },
      { status: 422 }
    )
  }

  const firebaseUserRepository = createFirebaseUserRepository(clientFirestore)

  let user: UserDTO
  try {
    // Creates the user in BetterAuth to handle account and user creation
    const authUser = await signUpInBetterAuth({
      email,
      password,
      name: `${firstName} ${lastName}`,
    })

    // Then sets additional user details in Firestore
    user = await firebaseUserRepository.create({
      id: authUser.id,
      firstName,
      middleName: typeof middleName === 'string' ? middleName : undefined,
      lastName,
      email,
      password,
      positions,
    })

    await sendWelcomeEmail(email)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'

    if (
      message.toLowerCase().includes('already exists') ||
      message.toLowerCase().includes('email-already-in-use') ||
      message.toLowerCase().includes('user already exists')
    ) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: { code: 'CONFLICT', message: 'A user with that email already exists' },
        },
        { status: 409 }
      )
    }

    if (
      message.toLowerCase().includes('invalid input') ||
      message.toLowerCase().includes('validation')
    ) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'VALIDATION_ERROR', message } },
        { status: 422 }
      )
    }

    if (
      message.toLowerCase().includes('password too short') ||
      message.toLowerCase().includes('password too weak')
    ) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: PASSWORD_STRENGTH_REQUIREMENTS },
        },
        { status: 422 }
      )
    }

    // eslint-disable-next-line no-console
    console.error('[POST /api/users] Unexpected error:', error)
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }

  return NextResponse.json<APIResponse<UserDTO>>({ success: true, data: user }, { status: 201 })
}
