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

  const result = await post<APIResponse<{ message: string }>>(ENDPOINTS.auth.forgotPassword, {
    email,
  })

  return NextResponse.json({ success: result.success, data: result.data }, { status: 200 })
}
