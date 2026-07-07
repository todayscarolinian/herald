import type { APIResponse, LoginResponse } from '@herald/types'
import {
  createAdminFirebaseUserRepository,
  getPositionsByIdsAdmin,
  loginSchema,
  NOT_REMEMBERED_SESSION_MAX_AGE_SECONDS,
  REMEMBERED_SESSION_MAX_AGE_SECONDS,
  resolveDomainsForPositions,
  SESSION_COOKIE_NAME,
  SESSION_TOKEN_FIELD,
} from '@herald/utils'
import { isAPIError } from 'better-auth/api'
import { Hono } from 'hono'
import { z } from 'zod'

import { adminAuditLogService } from '../../lib/audit-log.ts'
import { auth } from '../../lib/auth.js'
import { UNEXPECTED_ERROR_MESSAGE } from '../../lib/error-messages.ts'
import { firestore } from '../../lib/firestore.ts'
import { parseAndValidateBody } from '../../lib/parse-body.ts'
import { authService } from '../../services/auth.service.ts'
const loginRouter = new Hono()

// Failed-login audit entries are only recorded when the email resolves to a
// known account -- this mirrors the "don't reveal email existence" behavior
// already used elsewhere in this route and avoids logging arbitrary
// attacker-supplied emails as if they were real users.
async function logFailedLoginAttempt(email: string): Promise<void> {
  const existingUser = await createAdminFirebaseUserRepository(firestore).findByEmail(email)
  if (existingUser) {
    adminAuditLogService.log('USER_LOGIN_FAILED', null, existingUser.id)
  }
}

// ---------------------------------------------------------------------------
// POST /auth/login/credentials
// ---------------------------------------------------------------------------
loginRouter.post('/credentials', async (c) => {
  const parsedBody = await parseAndValidateBody(c, loginSchema)
  if (!parsedBody.ok) {
    return parsedBody.response
  }

  const { email, password, rememberMe } = parsedBody.data

  // Authenticate via BetterAuth -- passes rememberMe so BetterAuth sets the
  // correct cookie duration (REMEMBERED_SESSION_MAX_AGE_SECONDS when true,
  // a BetterAuth-internal fixed 1-day session when false/unset).
  let signInResult: Awaited<ReturnType<typeof auth.api.signInEmail>>
  try {
    signInResult = await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe: rememberMe ?? false,
      },
    })
  } catch (err) {
    if (isAPIError(err)) {
      if (err.statusCode === 401) {
        await logFailedLoginAttempt(email)
        return c.json<APIResponse>(
          {
            success: false,
            error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
          },
          401
        )
      }

      if (err.statusCode === 403) {
        // Email not verified
        await logFailedLoginAttempt(email)
        return c.json<APIResponse>(
          {
            success: false,
            error: {
              code: 'EMAIL_NOT_VERIFIED',
              message: 'Please verify your email before signing in',
            },
          },
          403
        )
      }

      if (err.statusCode === 429) {
        await logFailedLoginAttempt(email)
        return c.json<APIResponse>(
          {
            success: false,
            error: {
              code: 'TOO_MANY_REQUESTS',
              message: 'Too many login attempts. Please try again later',
            },
          },
          429
        )
      }
    }

    console.error('[login/credentials] Unexpected error during signInEmail:', err)
    return c.json<APIResponse>(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: UNEXPECTED_ERROR_MESSAGE },
      },
      500
    )
  }

  const { exists: isUserExists, active: isUserActive } = await authService.checkUserExistsAndActive(
    signInResult.user.email
  )

  if (!isUserExists) {
    // This should never happen since the user was just authenticated successfully via BetterAuth,
    // but we check just in case of a data inconsistency between BetterAuth and Firestore.
    console.warn(
      `[login/credentials] No Firestore user data found for authenticated user email ${signInResult.user.email}`
    )
    return c.json<APIResponse>(
      {
        success: false,
        error: {
          code: 'USER_DATA_NOT_FOUND',
          message: 'User data not found. Please contact support.',
        },
      },
      500
    )
  }

  if (!isUserActive) {
    // Revoke the session we just created
    try {
      await auth.api.revokeSession({
        headers: new Headers({
          cookie: `${SESSION_COOKIE_NAME}.${SESSION_TOKEN_FIELD}=${signInResult.token}`,
        }),
        body: { token: signInResult.token },
      })
    } catch (revokeErr) {
      console.error('[login/credentials] Failed to revoke session for disabled user:', revokeErr)
    }

    adminAuditLogService.log('USER_LOGIN_FAILED', null, signInResult.user.id)

    return c.json<APIResponse>(
      {
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Your account has been disabled. Please contact an administrator',
        },
      },
      403
    )
  }

  const user = signInResult.user
  // Cast to Record to access custom Firestore fields not defined in BetterAuth's user type
  const userRecord = user as Record<string, unknown>

  const expiresAt = rememberMe
    ? Date.now() + REMEMBERED_SESSION_MAX_AGE_SECONDS * 1000
    : Date.now() + NOT_REMEMBERED_SESSION_MAX_AGE_SECONDS * 1000

  adminAuditLogService.log('USER_LOGIN_SUCCESS', null, user.id)

  const positions = await getPositionsByIdsAdmin(
    firestore,
    (userRecord.positions as string[]) ?? []
  )
  const domains = resolveDomainsForPositions(positions)

  return c.json<LoginResponse>({
    success: true,
    session: {
      token: signInResult.token,
      expiresAt,
    },
    user: {
      id: user.id,
      email: user.email,
      name: userRecord.name as string,
      firstName: userRecord.firstName as string,
      middleName: userRecord.middleName as string | undefined,
      lastName: userRecord.lastName as string,
      positions,
      domains,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      mustChangePassword: Boolean(userRecord.mustChangePassword),
      createdAt:
        user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
      updatedAt:
        user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt),
    },
  })
})

// ---------------------------------------------------------------------------
// POST /auth/login/google
//
// The actual OAuth flow is handled entirely on the client (browser). This
// endpoint only guards that the Google-authenticated user exists in our system
// and is not disabled before the client stores the session.
// ---------------------------------------------------------------------------
const googleGuardSchema = z.object({
  email: z.email('Invalid email address'),
})

loginRouter.post('/google', async (c) => {
  const parsedBody = await parseAndValidateBody(c, googleGuardSchema)
  if (!parsedBody.ok) {
    return parsedBody.response
  }

  const { email } = parsedBody.data

  // Look up user in Firestore by email
  const { exists: isUserExists, active: isUserActive } =
    await authService.checkUserExistsAndActive(email)

  if (!isUserExists) {
    // Return generic 401 instead of 404 to avoid leaking email existence
    return c.json<APIResponse>(
      {
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      },
      401
    )
  }

  if (!isUserActive) {
    return c.json<APIResponse>(
      {
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Your account has been disabled. Please contact an administrator',
        },
      },
      403
    )
  }

  return c.json<APIResponse>({ success: true })
})

export default loginRouter
