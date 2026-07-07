import type { APIResponse, Domain, VerifySessionResponse } from '@herald/types'

export interface VerifiedSessionUser {
  id: string
  domains: Domain[]
}

export async function verifySessionFromCookie(
  cookieHeader: string
): Promise<VerifiedSessionUser | null> {
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
  const data = (await res.json()) as APIResponse<VerifySessionResponse>
  return data.success && data.data?.valid && data.data.user ? data.data.user : null
}

const WRITE_ACCESS_DOMAIN: Domain = 'TC Herald'

export function hasHeraldWriteAccess(domains: Domain[]): boolean {
  return domains.includes(WRITE_ACCESS_DOMAIN)
}
