import { auth } from '../lib/auth.ts'

export class SessionService {
  async verifySession(headers: Headers) {
    // BetterAuth handles session caching automatically
    const session = await auth.api.getSession({
      headers,
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
