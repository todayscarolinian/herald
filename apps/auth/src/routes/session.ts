import { SESSION_COOKIE_NAME } from '@herald/utils'
import { Hono } from 'hono'

import { auth } from '../lib/auth.ts'

const session = new Hono()

session.post('/logout', async (c) => {
  const cookieName = `${SESSION_COOKIE_NAME}.session_token`

  // Login page lives where?
  const loginUrl = `${process.env.NEXT_PUBLIC_CORE_URL ?? 'https://herald.todayscarolinian.com'}/login`

  // Attempt BetterAuth revocation. Swallow all errors — logout must

  try {
    await auth.api.signOut({
      headers: c.req.raw.headers,
    })
  } catch {
    // Intentionally swallowed. Session may already be expired or absent.
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

  return c.redirect(loginUrl, 302)
})

export { session }
