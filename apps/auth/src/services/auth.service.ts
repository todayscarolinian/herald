import { auth } from '../lib/auth.js'
export class SessionService {
  async verifySession(token: string) {
    // BetterAuth handles session caching automatically
    await auth.api.getSession({
      headers: {
        cookie: `better-auth.session_token=${token}`,
      },
    })
  }

  async invalidateSession(sessionId: string) {
    await auth.api.signOut({
      headers: {
        'x-session-id': sessionId,
      },
    })
  }
}

export const sessionService = new SessionService()
