import { APIResponse, LoginRequest } from '@herald/types'
import { loginSchema } from '@herald/utils'
import { isAPIError } from 'better-auth/api'
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
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { email, password, rememberMe } = validationResult.data

  try {
    await post<APIResponse>(ENDPOINTS.auth.loginCredentials, { email, password, rememberMe })
  } catch (error) {
    if (isAPIError(error)) {
      return NextResponse.json({ error: { message: error.message } }, { status: error.statusCode })
    } else if (error instanceof Error) {
      return NextResponse.json({ error: { message: error.message } }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
