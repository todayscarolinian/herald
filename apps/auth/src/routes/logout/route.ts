import type { APIResponse } from '@herald/types'
import { SESSION_COOKIE_NAME, SESSION_TOKEN_FIELD } from '@herald/utils'
import { isAPIError } from 'better-auth/api'
import { Hono } from 'hono'

import { adminAuditLogService } from '../../lib/audit-log.ts'
import { auth } from '../../lib/auth.ts'

const logout = new Hono()

logout.post('/logout', async (c) => {
  const cookieName = `${SESSION_COOKIE_NAME}.${SESSION_TOKEN_FIELD}`

  // Resolve the signed-in user before invalidating the session, since signOut
  // leaves nothing to identify who logged out.
  const currentSession = await auth.api.getSession({ headers: c.req.raw.headers }).catch(() => null)

  try {
    await auth.api.signOut({
      headers: c.req.raw.headers,
    })

    if (currentSession?.user.id) {
      adminAuditLogService.log('USER_LOGOUT', null, currentSession.user.id)
    }
  } catch (err) {
    if (isAPIError(err)) {
      // Session not found or already expired — expected, safe to ignore.
    } else {
      console.error('[auth/logout] Unexpected error during signOut:', err)
    }
  }

  // Clear the shared SSO cookie. All attributes must exactly match what
  // BetterAuth set when it created the cookie, or browsers will silently
  // ignore the clearing directive.
  //
  // Domain matches auth.ts: crossSubDomainCookies.domain = 'todayscarolinian.com'

  c.header(
    'Set-Cookie',
    [
      `${cookieName}=; Path=/`,
      `Domain=todayscarolinian.com`,
      `Max-Age=0`,
      `HttpOnly`,
      `Secure`,
      `SameSite=Lax`,
    ].join('; ')
  )

  return c.json<APIResponse>({ success: true })
})

export { logout }
