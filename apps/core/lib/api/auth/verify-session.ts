import type { APIResponse } from '@herald/types'

export async function verifySessionFromCookie(
  cookieHeader: string
): Promise<{ id: string } | null> {
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
