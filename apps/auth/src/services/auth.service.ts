import { UUID } from '@herald/types'
import { createAdminFirebaseUserRepository } from '@herald/utils'
import { isAPIError } from 'better-auth/api'

import { firestore } from '../lib/firestore.ts'
import { emailService } from './email.service.ts'

const userRepository = createAdminFirebaseUserRepository(firestore)

type WelcomeEmailResult = {
  success: boolean
  code?: 'EMAIL_PROVIDER_ERROR' | 'INTERNAL_ERROR'
}

export class AuthService {
  async sendWelcomeEmail(userId: UUID, temporaryPassword: string): Promise<WelcomeEmailResult> {
    try {
      const existingUserData = await userRepository.findById(userId)

      if (!existingUserData) {
        return { success: false, code: 'INTERNAL_ERROR' }
      }

      const baseCoreUrl = process.env.NEXT_PUBLIC_CORE_URL ?? 'https://herald.todayscarolinian.com'
      const changePasswordUrl = `${baseCoreUrl}/change-password`

      const fullName = [
        existingUserData.firstName,
        existingUserData.middleName,
        existingUserData.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .trim()

      const emailResult = await emailService.sendWelcomeEmail(
        existingUserData.email,
        temporaryPassword,
        fullName,
        changePasswordUrl
      )

      if ((emailResult as { error?: unknown })?.error) {
        return { success: false, code: 'EMAIL_PROVIDER_ERROR' }
      }

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
