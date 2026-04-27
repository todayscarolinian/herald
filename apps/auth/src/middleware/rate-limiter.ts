import type { RateLimitContext, RateLimitRule } from '@herald/types'
import { RATE_LIMIT_THRESHOLDS } from '@herald/types'
import { SESSION_COOKIE_NAME, SESSION_TOKEN_FIELD } from '@herald/utils'
import type { Context, Next } from 'hono'

import { ApiException } from '../lib/errors/api-exception.ts'
import { RateLimitException } from '../lib/errors/rate-limit-exception.ts'
import { checkRateLimit, isLimited } from '../lib/rate-limiter.ts'

type RateLimitPolicy = {
  rule: RateLimitRule
  status: 400 | 403 | 429
  code: string
  message: string
}

const BETTER_AUTH_SIGN_UP_PATH = '/api/auth/sign-up/email'
const BETTER_AUTH_REFRESH_TOKEN_PATHS = new Set(['/api/auth/refresh-token'])

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1)
  }

  return path
}

function getCookieValue(cookieHeader: string, key: string): string | undefined {
  const parts = cookieHeader.split(';')

  for (const part of parts) {
    const [rawName, ...rest] = part.trim().split('=')
    if (rawName !== key) {continue}

    return rest.join('=') || undefined
  }

  return undefined
}

function getClientIp(c: Context): string | undefined {
  const forwardedFor = c.req.header('x-forwarded-for')
  if (forwardedFor) {return forwardedFor.split(',')[0]?.trim()}

  const cfIp = c.req.header('cf-connecting-ip')
  if (cfIp) {return cfIp.trim()}

  return c.req.header('x-real-ip') ?? undefined
}

function getUserId(c: Context): string | undefined {
  const fromHeader = c.req.header('x-user-id') || c.req.header('x-auth-user-id')
  if (fromHeader) {return fromHeader}

  const authHeader = c.req.header('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    // Keep keying stable per token when a user id is unavailable.
    return `token:${authHeader.slice('Bearer '.length).trim()}`
  }

  const sessionCookieName = `${SESSION_COOKIE_NAME}.${SESSION_TOKEN_FIELD}`
  const cookieHeader = c.req.header('cookie')
  if (cookieHeader) {
    const sessionToken = getCookieValue(cookieHeader, sessionCookieName)
    if (sessionToken) {
      return `session:${sessionToken}`
    }
  }

  return undefined
}

function resolveRateLimitPolicy(path: string, method: string): RateLimitPolicy | null {
  const normalizedPath = normalizePath(path)
  const normalizedMethod = method.toUpperCase()

  if (normalizedMethod === 'POST' && normalizedPath === '/auth/login/credentials') {
    return {
      rule: { ...RATE_LIMIT_THRESHOLDS.LOGIN, methodScope: 'perIP', keyPrefix: 'login' },
      status: 403,
      code: 'RATE_LIMIT_LOGIN',
      message: 'Too many login attempts. Please try again later',
    }
  }

  if (normalizedMethod === 'POST' && normalizedPath === '/auth/login/google') {
    return {
      rule: { ...RATE_LIMIT_THRESHOLDS.LOGIN, methodScope: 'perIP', keyPrefix: 'login-google' },
      status: 403,
      code: 'RATE_LIMIT_LOGIN_GOOGLE',
      message: 'Too many login attempts. Please try again later',
    }
  }

  if (normalizedMethod === 'POST' && normalizedPath === '/auth/forgot-password') {
    return {
      rule: {
        ...RATE_LIMIT_THRESHOLDS.FORGOT_PASSWORD,
        methodScope: 'perIP',
        keyPrefix: 'forgot-password',
      },
      status: 400,
      code: 'RATE_LIMIT_FORGOT_PASSWORD',
      message: 'Too many requests - please try again later',
    }
  }

  // BetterAuth-style endpoints handled by auth.handler.
  if (normalizedMethod === 'POST' && normalizedPath === BETTER_AUTH_SIGN_UP_PATH) {
    return {
      rule: { ...RATE_LIMIT_THRESHOLDS.LOGIN, methodScope: 'perIP', keyPrefix: 'signup' },
      status: 429,
      code: 'RATE_LIMIT_SIGNUP',
      message: 'Too many sign up attempts. Please try again later',
    }
  }

  if (normalizedMethod === 'POST' && BETTER_AUTH_REFRESH_TOKEN_PATHS.has(normalizedPath)) {
    return {
      rule: {
        windowSeconds: 60,
        maxRequests: 20,
        methodScope: 'perUser',
        keyPrefix: 'refresh-token',
      },
      status: 429,
      code: 'RATE_LIMIT_TOKEN_REFRESH',
      message: 'Too many token refresh requests. Please try again later',
    }
  }

  return null
}

export default async function rateLimiterMiddleware(c: Context, next: Next) {
  const normalizedPath = normalizePath(c.req.path)
  const policy = resolveRateLimitPolicy(normalizedPath, c.req.method)
  if (!policy) {
    await next()
    return
  }

  const context: RateLimitContext = {
    route: normalizedPath,
    method: c.req.method,
    ip: getClientIp(c),
    userId: getUserId(c),
    now: Date.now(),
  }

  if (policy.rule.methodScope === 'perUser' && !context.userId && context.ip) {
    // Prevent 500s for cookie-based flows where user identity is unavailable pre-auth.
    context.userId = `ip:${context.ip}`
  }

  let result: Awaited<ReturnType<typeof checkRateLimit>>
  try {
    result = await checkRateLimit(context, policy.rule)
  } catch (err) {
    console.error('[rate-limiter-middleware] Rate limiter failed:', err)
    throw new ApiException({
      status: 500,
      code: 'RATE_LIMITER_UNAVAILABLE',
      message: 'Unable to apply rate limiting at this time. Please try again later.',
    })
  }

  c.set('rateLimitContext', context)
  c.set('rateLimitResult', result)

  if (isLimited(result)) {
    throw new RateLimitException(result, {
      status: policy.status,
      code: policy.code,
      message: policy.message,
    })
  }

  await next()
}
