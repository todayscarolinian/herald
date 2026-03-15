import type { UserProfile } from '@herald/types'
import { sendEmail, SESSION_COOKIE_NAME } from '@herald/utils'
import { betterAuth } from 'better-auth'
import { Session } from 'better-auth'
import { openAPI } from 'better-auth/plugins'
import { firestoreAdapter } from 'better-auth-firestore'

import { firestore } from './firestore.ts'

const trustedOrigins = [
  'https://*.todayscarolinian.com',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
]

export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }, _request) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        text: `Click the link to reset your password: ${url}`,
      })
    },
  },
  advanced: {
    cookiePrefix: SESSION_COOKIE_NAME,
    crossSubDomainCookies: {
      enabled: true,
      domain: 'todayscarolinian.com',
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
    fields: {
      name: 'firstName',
    },
    additionalFields: {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      middleName: { type: 'string', required: false },
      positions: { type: 'string[]', defaultValue: [], required: false, input: false },
      disabled: { type: 'boolean', defaultValue: false, required: false, input: false },
      mustChangePassword: { type: 'boolean', defaultValue: false, required: true, input: false },
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
