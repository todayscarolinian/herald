import type { APIResponse, LoginResponse, Position } from '@herald/types'
import {
  createFirebaseUserRepository,
  loginSchema,
  SESSION_COOKIE_NAME,
  SESSION_TOKEN_FIELD,
} from '@herald/utils'
import { isAPIError } from 'better-auth/api'
import { Hono } from 'hono'
import { z } from 'zod'

import { auth } from '../../lib/auth.js'
import { firestore } from '../../lib/firestore.js'

const loginRouter = new Hono()
const firebaseUserRepository = createFirebaseUserRepository(firestore)

// ---------------------------------------------------------------------------
// POST /auth/login/credentials
// ---------------------------------------------------------------------------
loginRouter.post('/credentials', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json<APIResponse>(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      400
    )
  }

  // Validate request body
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }))
    const message = errorDetails.map((d) => `${d.field}: ${d.message}`).join(', ')

    return c.json<APIResponse<typeof errorDetails>>(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message },
        data: errorDetails,
      },
      422
    )
  }

  const { email, password, rememberMe } = parsed.data

  // Authenticate via BetterAuth -- passes rememberMe so BetterAuth sets the
  // correct cookie duration (30-day when true, default 5-day when false/unset).
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
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      500
    )
  }

  const userData = await firebaseUserRepository.findById({ id: signInResult.user.id })

  if (!userData) {
    // This should never happen since the user was just authenticated successfully via BetterAuth,
    // but we check just in case of a data inconsistency between BetterAuth and Firestore.
    console.warn(
      `[login/credentials] No Firestore user data found for authenticated user ID ${signInResult.user.id}`
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

  if (userData?.disabled === true) {
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
    ? Date.now() + 30 * 24 * 60 * 60 * 1000
    : Date.now() + 5 * 24 * 60 * 60 * 1000

  return c.json<LoginResponse>({
    success: true,
    session: {
      token: signInResult.token,
      expiresAt,
    },
    user: {
      id: user.id,
      email: user.email,
      firstName: userRecord.firstName as string,
      middleName: userRecord.middleName as string | undefined,
      lastName: userRecord.lastName as string,
      positions: (userRecord.positions as Position[]) ?? [],
      emailVerified: user.emailVerified,
      disabled: userData.disabled,
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
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json<APIResponse>(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      400
    )
  }

  const parsed = googleGuardSchema.safeParse(body)
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }))
    const message = errorDetails.map((d) => `${d.field}: ${d.message}`).join(', ')

    return c.json<APIResponse<typeof errorDetails>>(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message },
        data: errorDetails,
      },
      422
    )
  }

  const { email } = parsed.data

  // Look up user in Firestore by email
  const userData = await firebaseUserRepository.findByEmail({ email })

  if (!userData) {
    // Return generic 401 instead of 404 to avoid leaking email existence
    return c.json<APIResponse>(
      {
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      },
      401
    )
  }

  if (userData.disabled === true) {
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
