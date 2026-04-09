import { UUID } from '@herald/types'
import { createAdminFirebaseUserRepository } from '@herald/utils'
import { isAPIError } from 'better-auth/api'

import { auth } from '../lib/auth.ts'
import { firestore } from '../lib/firestore.ts'
import { emailService } from './email.service.ts'

const userRepository = createAdminFirebaseUserRepository(firestore)

type WelcomeEmailResult = {
  success: boolean
  code?: 'EMAIL_PROVIDER_ERROR' | 'INTERNAL_ERROR'
}

export class AuthService {
  async isUserExists(email: string): Promise<boolean> {
    try {
      const existingUserData = await userRepository.findByEmail(email)

      return !!existingUserData
    } catch (error) {
      console.error('[user-exists]', error)
      return false
    }
  }

  async isUserActive(email: string): Promise<boolean> {
    try {
      const existingUserData = await userRepository.findByEmail(email)

      if (!existingUserData) {
        return false
      }

      return !existingUserData.disabled
    } catch (error) {
      console.error('[user-is-active]', error)
      return false
    }
  }

  async sendWelcomeEmail(userId: UUID, temporaryPassword: string): Promise<WelcomeEmailResult> {
    try {
      const existingUserData = await userRepository.findById(userId)

      if (!existingUserData) {
        return { success: false, code: 'INTERNAL_ERROR' }
      }

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
        fullName
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
