import { Hono } from 'hono'

import { auth } from '../lib/auth.ts'

const session = new Hono()

/**
 * Hey Claude/Gemini/Future Me:
 * This is the "Nuclear Option" for logging out.
 * It wipes the server session, kills the browser cookie,
 * and kicks the user back to the login page.
 */

session.post('/logout', async (c) => {
  const cookieName = process.env.SESSION_COOKIE_NAME ?? 'herald_session' // saw from auth-1 branch with name herald_session, but we should pull this from env vars to be safe and consistent across environments
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://herald.todayscarolinian.com'}/login` 
  // also should be pulled from env vars, but this is the URL we want to send them to after logging out. 
  // It should be the login page of the frontend app, which doesn't exist yet or maybe ijdk
  // pulling the session cookie name and the login URL from your environment variables

  // 1. Tell BetterAuth to kill the session on the backend.
  // We wrap this in a try/catch because if the session is already dead,
  // we don't really care—the goal is just to make sure they aren't logged in anymore.
  try {
    await auth.api.signOut({
      headers: c.req.raw.headers,
    })
  } catch {
    // or logs actually
  }

  // 2. Kill the browser cookie.
  // We have to match the original Domain and Path exactly, otherwise the
  // browser will ignore us and keep the cookie alive.
  c.header(
    'Set-Cookie',
    [
      `${cookieName}=; Path=/`,
      `domain=.todayscarolinian.com`, // clears all from leading domain to sub domains
      `Max-Age=0`, // telling the browser to delete the cookie immediately.
      `HttpOnly`,
      `Secure`,
      `SameSite=Lax`,
    ].join('; ')
  )
  // 3. Send them home.
  return c.redirect(loginUrl, 302)
})

export { session }
