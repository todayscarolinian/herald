import type { APIResponse, CreateUserInput, UserDTO } from '@herald/types'
import { createFirebaseUserRepository } from '@herald/utils'
import { getApps, initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

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

  const firebaseUserRepository = createFirebaseUserRepository(clientFirestore, {
    signUpEmail: async (params: {
      email: string
      password: string
      firstName: string
      lastName: string
    }) => {
      const authUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_AUTH_URL
      if (!authUrl) {
        throw new Error('BETTER_AUTH_URL is not configured')
      }

      const res = await fetch(`${authUrl}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: authUrl,
        },
        body: JSON.stringify({
          email: params.email,
          password: params.password,
          name: `${params.firstName} ${params.lastName}`,
        }),
      })

      const rawText = await res.text()
      // eslint-disable-next-line no-console
      console.log('[signUpEmail] status:', res.status, 'body:', rawText)
      const data = JSON.parse(rawText) as { user?: { id?: string }; message?: string }

      // const data = (await res.json()) as { user?: { id?: string }; message?: string }

      if (!res.ok) {
        throw new Error(data?.message ?? `BetterAuth sign-up failed: ${res.status}`)
      }

      if (!data?.user?.id) {
        throw new Error('Failed to create auth user: no ID returned')
      }

      return { id: data.user.id }
    },
  })

  let user: UserDTO
  try {
    user = await firebaseUserRepository.create({
      firstName,
      middleName: typeof middleName === 'string' ? middleName : undefined,
      lastName,
      email,
      password,
      positions,
    })
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
