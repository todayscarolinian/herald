import { isAPIError } from 'better-auth/api'

import { auth } from '../lib/auth.ts'

export class AuthService {
  async resetPassword(token: string, newPassword: string) {
    try {
      await auth.api.resetPassword({
        body: { token, newPassword },
      })
      return { success: true }
    } catch (error) {
      console.error('[reset-password]', error)
      if (isAPIError(error)) {
        if (error?.body?.code === 'INVALID_TOKEN') {
          return { success: false, code: 'AUTH_INVALID' }
        }
        return { success: false, code: 'AUTH_API_ERROR' }
      }
      return { success: false, code: 'INTERNAL_ERROR' }
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
    headers: Headers
  ): Promise<{ success: true } | { success: false; code: string }> {
    try {
      await auth.api.changePassword({
        body: { currentPassword, newPassword, revokeOtherSessions: true },
        headers,
      })
      return { success: true }
    } catch (error) {
      console.error('[change-password]', error)
      if (isAPIError(error)) {
        if (error?.body?.code === 'INVALID_PASSWORD') {
          return { success: false, code: 'INVALID_CREDENTIALS' }
        }
        if (error.statusCode === 401) {
          return { success: false, code: 'UNAUTHORIZED' }
        }
        return { success: false, code: 'AUTH_API_ERROR' }
      }
      return { success: false, code: 'INTERNAL_ERROR' }
    }
  }
}

export const authService = new AuthService()
