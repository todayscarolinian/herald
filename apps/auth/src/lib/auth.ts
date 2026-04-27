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
      disableSignUp: true,
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
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await emailService.sendVerificationEmail(user, url)
    },
    requireEmailVerification: true,
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
      positions: { type: 'string[]', defaultValue: [], required: true },
      disabled: { type: 'boolean', defaultValue: false, required: true },
      mustChangePassword: { type: 'boolean', defaultValue: false, required: true },
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
  rateLimit: {
    enabled: true,
    customRules: {
      '/send-verification-email': {
        window: 60, // time in seconds
        max: 2, // max requests per window
      },
    },
  },
  plugins: [openAPI()],
})
