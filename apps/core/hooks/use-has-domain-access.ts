'use client'

import { useSession } from '@/lib/auth-client'

// This app's own domain. Copying this hook into another TC app? Change this
// constant to that app's domain, and swap the `useSession` call below for a
// fetch to Herald's `/verify-session` endpoint (its response also includes
// `domains: string[]`) -- everything else in this file stays the same.
const REQUIRED_DOMAIN = 'TC Herald'

export function useHasDomainAccess() {
  const { data: session, isPending } = useSession()

  const domains = (session?.user as { domains?: string[] } | undefined)?.domains ?? []
  const hasAccess = domains.includes(REQUIRED_DOMAIN)

  return { hasAccess, isPending }
}
