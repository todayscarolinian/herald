import { auth } from '../lib/auth.ts'

export class SessionService {
  async verifySession(headers: Headers) {
    const session = await auth.api.getSession({
      headers,
      query: { disableCookieCache: true },
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
