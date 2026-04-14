import { APIResponse, RATE_LIMIT_THRESHOLDS } from '@herald/types'
import { forgotPasswordSchema } from '@herald/utils'
import { isAPIError } from 'better-auth/api'
import { Hono } from 'hono'

import { auth } from '../../lib/auth.ts'
import { ApiException } from '../../lib/errors/api-exception.ts'
import { RateLimitException } from '../../lib/errors/rate-limit-exception.ts'
import { checkRateLimit, isLimited } from '../../lib/rate-limiter.ts'

const app = new Hono()

function getClientIp(c: {
  req: { header: (name: string) => string | undefined }
}): string | undefined {
  const forwardedFor = c.req.header('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim()
  }

  const cfIp = c.req.header('cf-connecting-ip')
  if (cfIp) {
    return cfIp.trim()
  }

  return c.req.header('x-real-ip') ?? undefined
}

app.post('/forgot-password', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json<APIResponse>(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      400
    )
  }

  const parsed = forgotPasswordSchema.safeParse(body)
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

  let rateLimitResult: Awaited<ReturnType<typeof checkRateLimit>>
  try {
    rateLimitResult = await checkRateLimit(
      {
        route: '/auth/forgot-password',
        method: 'POST',
        ip: getClientIp(c),
        now: Date.now(),
      },
      {
        ...RATE_LIMIT_THRESHOLDS.FORGOT_PASSWORD,
        methodScope: 'perIP',
        keyPrefix: 'forgot-password',
      }
    )
  } catch (err) {
    console.error('[forgot-password] Rate limiter failed:', err)
    throw new ApiException({
      status: 500,
      code: 'RATE_LIMITER_UNAVAILABLE',
      message: 'Unable to apply rate limiting at this time. Please try again later.',
    })
  }

  if (isLimited(rateLimitResult)) {
    throw new RateLimitException(rateLimitResult, {
      status: 400,
      code: 'RATE_LIMIT_FORGOT_PASSWORD',
      message: 'Too many requests - please try again later',
    })
  }

  try {
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${process.env.NEXT_PUBLIC_CORE_URL}/reset-password`,
      },
      headers: c.req.raw.headers,
    })
  } catch (err) {
    if (isAPIError(err)) {
      if (err.statusCode === 404) {
        // Don't reveal that the email doesn't exist - respond with success
        console.log(`[forgot-password] Password reset requested for non-existent email: ${email}`)
        return c.json<APIResponse>({
          success: true,
          data: {
            message: 'If an account with that email exists, a password reset link has been sent.',
          },
        })
      }

      if (err.statusCode === 401) {
        return c.json<APIResponse>(
          {
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Unauthorized request' },
          },
          401
        )
      }

      if (err.statusCode === 403) {
        return c.json<APIResponse>(
          {
            success: false,
            error: { code: 'FORBIDDEN', message: 'Forbidden request' },
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
              message: 'Too many requests - please try again later',
            },
          },
          429
        )
      }
    }

    console.error('[forgot-password] Unexpected error during forgotPassword:', err)
    return c.json<APIResponse>(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      500
    )
  }

  return c.json<APIResponse>({
    success: true,
    data: {
      message: 'If an account with that email exists, a password reset link has been sent.',
    },
  })
})

export default app
