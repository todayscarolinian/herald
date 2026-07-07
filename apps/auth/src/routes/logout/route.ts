import type { APIResponse } from '@herald/types'
import { isAPIError } from 'better-auth/api'
import { Hono } from 'hono'

import { adminAuditLogService } from '../../lib/audit-log.ts'
import { auth } from '../../lib/auth.ts'

const logout = new Hono()

logout.post('/logout', async (c) => {
  // Resolve the signed-in user before invalidating the session, since signOut
  // leaves nothing to identify who logged out.
  const currentSession = await auth.api.getSession({ headers: c.req.raw.headers }).catch(() => null)

  try {
    const result = await auth.api.signOut({ headers: c.req.raw.headers, returnHeaders: true })

    result.headers.getSetCookie().forEach((cookie) => {
      c.header('Set-Cookie', cookie, { append: true })
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

  return c.json<APIResponse>({ success: true })
})

export { logout }
