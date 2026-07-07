import {
  createAdminAuditLogService,
  getPositionsByIdsAdmin,
  REMEMBERED_SESSION_MAX_AGE_SECONDS,
  resolveDomainsForPositions,
  SESSION_COOKIE_NAME,
} from '@herald/utils'
import { betterAuth } from 'better-auth'
import { customSession, openAPI } from 'better-auth/plugins'
import { firestoreAdapter } from 'better-auth-firestore'

import { emailService } from '../services/email.service.ts'
import { COLLECTIONS } from './collection-names.ts'
import { firestore } from './firestore.ts'

const trustedOrigins = [
  'https://*.todayscarolinian.com',
  ...(process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://localhost:3001']
    : []),
]

// Shape of the additionalFields configured below, layered onto BetterAuth's
// base user record -- these aren't part of BetterAuth's own generic typing,
// so consumers of the session/user object must cast to this shape to reach them.
type CustomUserFields = {
  firstName: string
  lastName: string
  middleName?: string
  positions: string[]
  disabled: boolean
  mustChangePassword: boolean
}

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
    onPasswordReset: ({ user }) => {
      const auditLog = createAdminAuditLogService(firestore)
      auditLog.log('USER_PASSWORD_RESET_COMPLETED', null, user.id)
      // revokeSessionsOnPasswordReset (above) drops all of this user's other
      // sessions right after this callback runs.
      auditLog.log('USER_SESSION_REVOKED', null, user.id)
      return Promise.resolve()
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await emailService.sendVerificationEmail(user, url)
    },
    // The initial verification link is sent as part of the merged welcome
    // email (see AuthService.sendWelcomeEmail) instead of automatically here,
    // since this hook has no access to the newly generated temp password.
    sendOnSignUp: false,
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
    // Applies when the user checks "Remember Me" at login. When unchecked,
    // BetterAuth ignores this and hardcodes the session to a 1-day TTL instead
    // (see internalAdapter.createSession's dontRememberMe branch).
    expiresIn: REMEMBERED_SESSION_MAX_AGE_SECONDS,
    updateAge: 60 * 60 * 24,
  },
  database: firestoreAdapter({
    firestore,
    namingStrategy: 'default',
    collections: {
      users: COLLECTIONS.USERS,
      sessions: COLLECTIONS.SESSIONS,
      accounts: COLLECTIONS.ACCOUNTS,
      verificationTokens: COLLECTIONS.VERIFICATION_TOKENS,
    },
  }),
  user: {
    additionalFields: {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      middleName: { type: 'string', required: true, defaultValue: '' },
      positions: { type: 'string[]', defaultValue: [], required: true },
      disabled: { type: 'boolean', defaultValue: false, required: true },
      mustChangePassword: { type: 'boolean', defaultValue: false, required: true },
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
  plugins: [
    openAPI(),
    customSession(async ({ session, user }) => {
      const customFields = user as unknown as CustomUserFields
      const middle = customFields.middleName ? ` ${customFields.middleName}` : ''
      const fullName = `${customFields.firstName}${middle} ${customFields.lastName}`.trim()

      const positions = await getPositionsByIdsAdmin(firestore, customFields.positions ?? [])
      const domains = resolveDomainsForPositions(positions)

      return {
        session,
        user: {
          ...user,
          ...customFields,
          name: fullName,
          positions,
          domains,
        },
      }
    }),
  ],
})
