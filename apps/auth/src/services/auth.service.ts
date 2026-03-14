import { SESSION_COOKIE_NAME } from '@herald/utils/constants'

import { auth } from '../lib/auth.js'

export class SessionService {
  async verifySession(token: string) {
    // BetterAuth handles session caching automatically
    const session = await auth.api.getSession({
      headers: {
        cookie: `${SESSION_COOKIE_NAME}.session_token=${token}`,
      },
    })

    return session
  }

  async invalidateSession(sessionId: string) {
    const res = await auth.api.signOut({
      headers: {
        'x-session-id': sessionId,
      },
    })

    return res
  }
}

export const sessionService = new SessionService()
