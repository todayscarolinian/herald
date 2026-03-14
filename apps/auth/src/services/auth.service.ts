import { auth } from '../lib/auth.js'
export class SessionService {
  async verifySession(token: string) {
    // BetterAuth handles session caching automatically
    const session = await auth.api.getSession({
      headers: {
        cookie: `herald_session.session_token=${token}`,
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
