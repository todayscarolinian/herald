import type { UserProfile } from '@herald/types'
import { SESSION_COOKIE_NAME } from '@herald/utils'
import { betterAuth } from 'better-auth'
import { Session } from 'better-auth'
import { openAPI } from 'better-auth/plugins'
import { firestoreAdapter } from 'better-auth-firestore'

import { emailService } from '../services/email.service.ts'
import { firestore } from './firestore.ts'

const trustedOrigins = [
  'https://*.todayscarolinian.com',
  ...(process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://localhost:3001']
    : []),
]

export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.given_name,
          lastName: profile.family_name,
        }
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }, _request) => {
      await emailService.sendPasswordReset(user.email, url)
    },
    requireEmailVerification: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await emailService.sendVerificationEmail(user, url)
    },
    sendOnSignIn: true,
  },
  advanced: {
    cookiePrefix: SESSION_COOKIE_NAME,
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.NODE_ENV === 'production' ? '.todayscarolinian.com' : undefined,
    },
  },
  trustedOrigins,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
      strategy: 'compact',
    },
    expiresIn: 60 * 60 * 24 * 5,
    updateAge: 60 * 60 * 24,
  },
  database: firestoreAdapter({
    firestore,
    namingStrategy: 'default',
    collections: {
      users: 'users',
      sessions: 'sessions',
      accounts: 'accounts',
      verificationTokens: 'verification_tokens',
    },
  }),
  user: {
    additionalFields: {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      middleName: { type: 'string', required: false },
      positions: { type: 'string[]', defaultValue: [], required: false, input: false },
      disabled: { type: 'boolean', defaultValue: false, required: false, input: false },
      welcomeEmailSent: { type: 'boolean', defaultValue: false, required: false, input: false },
      mustChangePassword: { type: 'boolean', defaultValue: false, required: true, input: false },
    },
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session, context) => {
          const userDoc = await firestore.collection('users').doc(session.userId).get()
          const userData = userDoc.data()

          if (
            !userData ||
            userData.mustChangePassword !== true ||
            userData.welcomeEmailSent === true
          ) {
            return
          }

          const requestBody = context?.body as { password?: unknown } | undefined
          const temporaryPassword =
            typeof requestBody?.password === 'string' ? requestBody.password : undefined

          if (!temporaryPassword) {
            console.warn(
              '[auth/databaseHooks.session.create] Skipping welcome email: no password in context'
            )
            return
          }

          const fullName = [userData.firstName, userData.middleName, userData.lastName]
            .filter(Boolean)
            .join(' ')
            .trim()
          const userName = fullName || userData.name || userData.email
          const baseCoreUrl =
            process.env.NEXT_PUBLIC_CORE_URL ?? 'https://herald.todayscarolinian.com'
          const changePasswordUrl = `${baseCoreUrl}/change-password`

          const result = await emailService.sendWelcomeEmail(
            String(userData.email),
            temporaryPassword,
            String(userName),
            changePasswordUrl
          )

          if ((result as { error?: unknown })?.error) {
            console.error('[auth/databaseHooks.session.create] Failed to send welcome email')
            return
          }

          await firestore
            .collection('users')
            .doc(session.userId)
            .set({ welcomeEmailSent: true }, { merge: true })
        },
      },
    },
  },
  callbacks: {
    session({ session, user }: { session: Session; user: UserProfile }) {
      const middle = user.middleName ? ` ${user.middleName}` : ''
      const fullName = `${user.firstName}${middle} ${user.lastName}`.trim()

      return {
        ...session,
        user: {
          ...user,
          name: fullName,
        },
      }
    },
  },
  plugins: [openAPI()],
})
