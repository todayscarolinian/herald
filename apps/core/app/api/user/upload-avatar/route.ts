import type { APIResponse } from '@herald/types'
import { NextRequest, NextResponse } from 'next/server'

import { uploadAvatar, UserServiceError } from '@/lib/api/services/user.service'

async function verifySession(cookieHeader: string) {
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL
  const res = await fetch(`${authUrl}/auth/verify-session`, {
    headers: {
      cookie: cookieHeader,
      'x-herald-internal-api-key': process.env.HERALD_INTERNAL_API_KEY ?? '',
    },
  })
  if (!res.ok) {return null}
  const data = (await res.json()) as APIResponse<{ valid: boolean; user: { id: string } }>
  return data.success && data.data?.valid ? data.data.user : null
}

export async function POST(request: NextRequest) {
  // 1. Verify session
  const cookieHeader = request.headers.get('cookie') ?? ''
  const user = await verifySession(cookieHeader)

  if (!user) {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No valid session' } },
      { status: 401 }
    )
  }

  // 2. Parse multipart form data
  let file: File | null = null
  try {
    const formData = await request.formData()
    file = formData.get('avatar') as File | null
  } catch {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid form data' } },
      { status: 400 }
    )
  }

  if (!file || file.size === 0) {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'BAD_REQUEST', message: 'No file provided' } },
      { status: 400 }
    )
  }

  // 3. Delegate to service
  try {
    const url = await uploadAvatar(user.id, file)
    return NextResponse.json<APIResponse>(
      { success: true, data: { profilePictureURL: url } },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof UserServiceError) {
      const status =
        error.code === 'INVALID_FILE_TYPE' || error.code === 'FILE_TOO_LARGE' ? 400 : 500
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: error.code, message: error.message } },
        { status }
      )
    }

    console.error('[upload-avatar]', error)
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
}
