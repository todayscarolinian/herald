import { APIResponse, LoginRequest, LoginResponse } from '@herald/types'
import { loginSchema } from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { post } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<LoginRequest>

  const validationResult = loginSchema.safeParse(body)

  if (!validationResult.success) {
    // Extract detailed validation errors
    const errorDetails = validationResult.error.issues.map((issue) => ({
      message: issue.message,
    }))
    const message = errorDetails.map((d) => `${d.message}`).join('\n')
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message,
        },
      },
      { status: 400 }
    )
  }

  const { email, password, rememberMe } = validationResult.data

  try {
    const result = await post<LoginResponse>(ENDPOINTS.auth.loginCredentials, {
      email,
      password,
      rememberMe,
    })

    if (!result.success) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            code: 'LOGIN_FAILED',
            message: 'Login failed. Please check your credentials and try again.',
          },
        },
        { status: 401 }
      )
    }

    return NextResponse.json<APIResponse<Omit<LoginResponse, 'success'>>>(
      {
        success: true,
        data: {
          session: result.session,
          user: result.user,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message:
            error instanceof Error ? error.message : 'An unexpected error occurred during login.',
        },
      },
      { status: 401 }
    )
  }
}
