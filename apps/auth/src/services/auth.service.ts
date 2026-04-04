import { isAPIError } from 'better-auth/api'

import { auth } from '../lib/auth.ts'
import { firestore } from '../lib/firestore.ts'
import { emailService } from './email.service.ts'

type WelcomeEmailUser = {
  id: string
  email: string
  firstName?: string
  middleName?: string
  lastName?: string
  name?: string
}

type WelcomeEmailResult = {
  success: boolean
  code?: 'EMAIL_PROVIDER_ERROR' | 'INTERNAL_ERROR'
}

export class AuthService {
  async sendWelcomeEmail(
    user: WelcomeEmailUser,
    temporaryPassword: string
  ): Promise<WelcomeEmailResult> {
    try {
      const existingUserDoc = await firestore.collection('users').doc(user.id).get()
      const existingUserData = existingUserDoc.data()

      // Idempotent behavior: if the welcome email was already sent, treat as success.
      if (existingUserData?.welcomeEmailSent === true) {
        return { success: true }
      }

      const baseCoreUrl = process.env.NEXT_PUBLIC_CORE_URL ?? 'https://herald.todayscarolinian.com'
      const changePasswordUrl = `${baseCoreUrl}/change-password`

      const fullName = [user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .join(' ')
        .trim()
      const userName = fullName || user.name?.trim() || user.email

      const emailResult = await emailService.sendWelcomeEmail(
        user.email,
        temporaryPassword,
        userName,
        changePasswordUrl
      )

      if ((emailResult as { error?: unknown })?.error) {
        return { success: false, code: 'EMAIL_PROVIDER_ERROR' }
      }

      await firestore
        .collection('users')
        .doc(user.id)
        .set({ welcomeEmailSent: true }, { merge: true })

      return { success: true }
    } catch (error) {
      console.error('[send-welcome-email]', error)
      return { success: false, code: 'INTERNAL_ERROR' }
    }
  }

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
}

export const authService = new AuthService()
