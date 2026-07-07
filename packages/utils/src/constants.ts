import type { Domain } from '@herald/types'

export const SESSION_COOKIE_NAME = 'herald_session'
export const SESSION_TOKEN_FIELD = 'session_token'

// Real session TTL when the user checks "Remember Me" at login -- must match
// `session.expiresIn` in apps/auth/src/lib/auth.ts, which is what BetterAuth
// actually uses to compute the session's expiresAt when rememberMe is true.
export const REMEMBERED_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90

// When rememberMe is false, BetterAuth hardcodes the session to a 1-day TTL
// internally (better-auth/dist/db/internal-adapter.mjs) -- this is not
// configurable, so this constant only mirrors that value for display purposes.
export const NOT_REMEMBERED_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24

export const MAX_BULK_BATCH_SIZE = 50

export const DOMAINS = [
  'TC Official Website',
  'USC Days',
  'TC Digital Archives',
  'TC Herald',
] as const satisfies readonly Domain[]

export const isValidDomain = (value: string): value is Domain =>
  (DOMAINS as readonly string[]).includes(value)

export const PASSWORD_STRENGTH_REQUIREMENTS =
  'Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)'

export const isValidPassword = (password: string) => {
  // At least 8 chars with upper, lower, number, and one special char from !@#$%^&*
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/
  return passwordRegex.test(password)
}
