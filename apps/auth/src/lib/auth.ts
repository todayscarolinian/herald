import type { UserProfile } from '@herald/types/user'
import { betterAuth } from 'better-auth'
import { Session } from 'better-auth'
import { firestoreAdapter } from 'better-auth-firestore'

import { firestore } from './firestore.ts'
export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: { enabled: true },
  cookiePrefix: 'herald_session',
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: 'todayscarolinian.com',
    },
  },
  trustedOrigins: [
    'https://todayscarolinian.com',
    'https://archives.todayscarolinian.com',
    'https://uscdays.todayscarolinian.com',
    'https://herald.todayscarolinian.com',
    'https://auth.todayscarolinian.com',
  ],
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
      verificationTokens: 'verificationTokens',
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
})
