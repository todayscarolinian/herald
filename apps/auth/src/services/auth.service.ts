<<<<<<< HEAD
export class AuthService {
  init() {
    return 'Hello from auth service'
=======
import { auth } from '../lib/auth.js'

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
>>>>>>> cde41c6 (feat: add BetterAuth-based verify-session endpoint)
  }
}

export const authService = new AuthService()
