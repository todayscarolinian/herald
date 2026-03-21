import { auth } from '../lib/auth.ts'

export class AuthService {
  async resetPassword(token: string, newPassword: string) {
    const res = await auth.api.resetPassword({
      body: { token, newPassword },
    })

    return res
  }
}

export const authService = new AuthService()
