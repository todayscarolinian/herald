import { APIResponse, ChangePasswordRequest } from '@herald/types'
import { changePasswordSchema } from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { ENDPOINTS } from '@/lib/api/endpoints'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<ChangePasswordRequest>

  const validationResult = changePasswordSchema.safeParse(body)

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

  const { currentPassword, newPassword, confirmPassword } = validationResult.data
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL

  try {
    const res = await fetch(`${authUrl}${ENDPOINTS.auth.changePassword}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') ?? '',
        'x-herald-internal-api-key': process.env.HERALD_INTERNAL_API_KEY ?? '',
      },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    })

    const result = (await res.json()) as APIResponse<{ message: string }>

    return NextResponse.json<APIResponse<{ message: string }>>(result, { status: res.status })
  } catch (error) {
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: {
          code: 'CHANGE_PASSWORD_FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred while changing your password.',
        },
      },
      { status: 500 }
    )
  }
}
