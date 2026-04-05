import { isAPIError } from 'better-auth/api'

import { auth } from '../lib/auth.ts'
import { firestore } from '../lib/firestore.ts'

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

  async verifyEmail(token: string) {
    try {
      await auth.api.verifyEmail({
        query: { token },
      })
      return { success: true }
    } catch (error) {
      console.error('[verify-email] Unexpected error:', error)
      if (isAPIError(error)) {
        const code = error.body?.code
        if (code === 'INVALID_TOKEN' || code === 'TOKEN_EXPIRED') {
          let emailResent = false
          try {
            const snapshot = await firestore
              .collection('verification_tokens')
              .where('token', '==', token)
              .limit(1)
              .get()

            if (!snapshot.empty) {
              const email = snapshot.docs[0]!.data().email as string
              const callbackURL = process.env.BETTER_AUTH_URL
              if (!callbackURL) {
                console.error('[verify-email] Missing BETTER_AUTH_URL')
                return { success: false, code: 'INTERNAL_ERROR', emailResent: false }
              }
              await auth.api.sendVerificationEmail({
                body: { email, callbackURL: `${callbackURL}/auth/verify-email` },
              })
              emailResent = true
            } else {
              console.warn('[verify-email] No verification token found for resend')
              return { success: false, code: 'TOKEN_NOT_FOUND', emailResent: false }
            }
          } catch (err) {
            console.error('[verify-email] Resend failed:', err)
          }
          return { success: false, code, emailResent }
        }
        return { success: false, code: 'AUTH_API_ERROR', emailResent: false }
      }
      return { success: false, code: 'INTERNAL_ERROR', emailResent: false }
    }
  }
}

export const authService = new AuthService()
