import type { APIResponse, LoginResponse, Position } from '@herald/types'
import { RATE_LIMIT_THRESHOLDS } from '@herald/types'
import { loginSchema, SESSION_COOKIE_NAME, SESSION_TOKEN_FIELD } from '@herald/utils'
import { isAPIError } from 'better-auth/api'
import { Hono } from 'hono'
import { z } from 'zod'

import { auth } from '../../lib/auth.js'
import { checkRateLimit, isLimited } from '../../lib/rate-limiter.ts'
import { authService } from '../../services/auth.service.ts'
const loginRouter = new Hono()

function getClientIp(c: {
  req: { header: (name: string) => string | undefined }
}): string | undefined {
  const forwardedFor = c.req.header('x-forwarded-for')
  if (forwardedFor) {return forwardedFor.split(',')[0]?.trim()}

  const cfIp = c.req.header('cf-connecting-ip')
  if (cfIp) {return cfIp.trim()}

  return c.req.header('x-real-ip') ?? undefined
}

function rateLimitErrorResponse(c: { json: <T>(body: T, status?: number) => Response }) {
  return c.json<APIResponse>(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to apply rate limiting at this time. Please try again later.',
      },
    },
    500
  )
}

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

  let rateLimitResult
  try {
    rateLimitResult = await checkRateLimit(
      {
        route: '/auth/login/credentials',
        method: 'POST',
        ip: getClientIp(c),
        now: Date.now(),
      },
      {
        ...RATE_LIMIT_THRESHOLDS.LOGIN,
        methodScope: 'perIP',
        keyPrefix: 'login',
      }
    )
  } catch (err) {
    console.error('[login/credentials] Rate limiter failed:', err)
    return rateLimitErrorResponse(c)
  }

  if (isLimited(rateLimitResult)) {
    if (rateLimitResult.retryAfterSeconds) {
      c.header('Retry-After', String(rateLimitResult.retryAfterSeconds))
    }

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

  const isUserExists = await authService.isUserExists(signInResult.user.email)
  const isUserActive = await authService.isUserActive(signInResult.user.email)

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
      disabled: user.disabled,
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

  let googleRateLimitResult
  try {
    googleRateLimitResult = await checkRateLimit(
      {
        route: '/auth/login/google',
        method: 'POST',
        ip: getClientIp(c),
        now: Date.now(),
      },
      {
        ...RATE_LIMIT_THRESHOLDS.LOGIN,
        methodScope: 'perIP',
        keyPrefix: 'login-google',
      }
    )
  } catch (err) {
    console.error('[login/google] Rate limiter failed:', err)
    return rateLimitErrorResponse(c)
  }

  if (isLimited(googleRateLimitResult)) {
    if (googleRateLimitResult.retryAfterSeconds) {
      c.header('Retry-After', String(googleRateLimitResult.retryAfterSeconds))
    }

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

  // Look up user in Firestore by email
  const isUserExists = await authService.isUserExists(email)
  const isUserActive = await authService.isUserActive(email)

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
