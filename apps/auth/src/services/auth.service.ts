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
      if (!isAPIError(error)) {
        console.error('[verify-email] Unexpected error:', error)
        return { success: false, code: 'INTERNAL_ERROR', emailResent: false }
      }

      if (error.body?.code !== 'INVALID_TOKEN' && error.statusCode !== 400) {
        return { success: false, code: 'AUTH_API_ERROR', emailResent: false }
      }

      let emailResent = false
      try {
        const snapshot = await firestore
          .collection('verification_tokens')
          .where('token', '==', token)
          .limit(1)
          .get()

        if (!snapshot.empty) {
          const email = snapshot.docs[0]!.data().email as string
          await auth.api.sendVerificationEmail({
            body: { email, callbackURL: `${process.env.NEXT_PUBLIC_AUTH_URL}/verify-email` },
          })
          emailResent = true
        }
      } catch (err) {
        console.error('[verify-email] Resend failed:', err)
      }

      return { success: false, code: 'AUTH_INVALID', emailResent }
    }
  }
}

export const authService = new AuthService()
