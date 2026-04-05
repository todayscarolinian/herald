import { createAdminFirebaseUserRepository } from '@herald/utils'
import { isAPIError } from 'better-auth/api'

import { firestore } from '../lib/firestore.ts'
import { emailService } from './email.service.ts'

const userRepository = createAdminFirebaseUserRepository(firestore)

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
  async sendWelcomeEmailOnFirstLogin(userId: string, temporaryPassword: string): Promise<void> {
    try {
      const userData = await userRepository.findById(userId)
      if (!userData) {
        return
      }

      if (userData.mustChangePassword !== true || userData.welcomeEmailSent === true) {
        return
      }

      const result = await this.sendWelcomeEmail(
        {
          id: userId,
          email: String(userData.email ?? ''),
          firstName: typeof userData.firstName === 'string' ? userData.firstName : undefined,
          middleName: typeof userData.middleName === 'string' ? userData.middleName : undefined,
          lastName: typeof userData.lastName === 'string' ? userData.lastName : undefined,
          name: typeof userData.name === 'string' ? userData.name : undefined,
        },
        temporaryPassword
      )

      if (!result.success) {
        console.error(
          '[send-welcome-email-on-first-login] Failed to send welcome email:',
          result.code
        )
      }
    } catch (error) {
      console.error('[send-welcome-email-on-first-login]', error)
    }
  }

  async sendWelcomeEmail(
    user: WelcomeEmailUser,
    temporaryPassword: string
  ): Promise<WelcomeEmailResult> {
    try {
      const existingUserData = await userRepository.findById(user.id)

      if (!existingUserData) {
        return { success: false, code: 'INTERNAL_ERROR' }
      }

      // Idempotent behavior: if the welcome email was already sent, treat as success.
      if (existingUserData.welcomeEmailSent === true) {
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

      await userRepository.markWelcomeEmailSent(user.id)

      return { success: true }
    } catch (error) {
      console.error('[send-welcome-email]', error)
      return { success: false, code: 'INTERNAL_ERROR' }
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const { auth } = await import('../lib/auth.ts')
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
