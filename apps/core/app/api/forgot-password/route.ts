import { APIResponse, ForgotPasswordRequest } from '@herald/types'
import { forgotPasswordSchema } from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { post } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<ForgotPasswordRequest>

  const validationResult = forgotPasswordSchema.safeParse(body)

  if (!validationResult.success) {
    // Extract detailed validation errors
    const errorDetails = validationResult.error.issues.map((issue) => ({
      message: issue.message,
    }))
    const message = errorDetails.map((d) => `${d.message}`).join('\n')
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { email } = validationResult.data

  try {
    const result = await post<APIResponse<{ message: string }>>(ENDPOINTS.auth.forgotPassword, {
      email,
    })

    if (!result.success) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            code: result.error?.code || 'FORGOT_PASSWORD_FAILED',
            message:
              result.error?.message ||
              'Failed to initiate password reset. Please check your email and try again.',
          },
        },
        { status: 401 }
      )
    }

    return NextResponse.json<APIResponse<{ message: string }>>(
      {
        success: true,
        data: {
          message:
            result.data?.message || 'Password reset instructions have been sent to your email.',
        },
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: {
          code: 'FORGOT_PASSWORD_FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred while processing your request.',
        },
      },
      { status: 401 }
    )
  }
}
