import type { APIResponse } from '@herald/types'
import { createMiddleware } from 'hono/factory'

/**
 * Internal API key protection middleware.
 *
 * Security model:
 * - Default deny: every request must provide a valid `x-herald-internal-api-key`
 *   header that matches `HERALD_INTERNAL_API_KEY`.
 * - Explicit allowlist: only routes required for public/browser-driven auth flows
 *   are exempt from header enforcement.
 * - Future safety: any newly added route is protected automatically unless it is
 *   intentionally allowlisted.
 *
 * Why this middleware exists:
 * - We need a single, centralized guard that applies consistently across all
 *   current and future routes.
 * - Keeping the check in one place avoids duplicated per-route logic and reduces
 *   the chance of accidentally exposing new endpoints.
 */

/**
 * Exact path allowlist.
 *
 * These paths are intentionally public because they are consumed directly by
 * browser clients or required for basic service visibility.
 *
 * Maintenance rule:
 * - Only add a route here when it must be accessible without the internal key.
 * - Prefer narrow exact paths over broad prefixes whenever possible.
 */
const ALLOWLIST_EXACT_PATHS = new Set(['/', '/health'])

/**
 * Prefix-based allowlist.
 *
 * `/api/auth` is reserved for BetterAuth-managed endpoints (such as OAuth and
 * callback-related routes) that may not be able to include custom internal
 * headers during browser redirects and provider callbacks.
 *
 * Maintenance rule:
 * - Prefix allowlists are powerful and broad. Add new prefixes sparingly and
 *   only when exact path matching is not practical.
 */
const ALLOWLIST_PATH_PREFIXES = ['/api/auth']

/**
 * Returns true when a path is exempt from internal API key enforcement.
 */
const isAllowlistedPath = (path: string): boolean => {
  if (ALLOWLIST_EXACT_PATHS.has(path)) {
    return true
  }

  return ALLOWLIST_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
}

const unauthorizedResponse = {
  success: false,
  error: { code: 'UNAUTHORIZED', message: 'Unauthorized request' },
} as const

/**
 * Enforcement flow:
 * 1) Allow CORS preflight (`OPTIONS`) so browsers can negotiate CORS correctly.
 * 2) Skip key checks for explicitly allowlisted paths.
 * 3) Validate server-side configured secret is present.
 * 4) Compare request header value to configured secret.
 * 5) Return 401 with a stable APIResponse payload on any failure.
 *
 * Notes:
 * - We intentionally return the same unauthorized message for missing and
 *   mismatched secrets to avoid leaking internal configuration details.
 * - The middleware reads only headers/path and does not mutate request state.
 */
const internalApiKeyMiddleware = createMiddleware(async (c, next) => {
  // Allow preflight requests through CORS without requiring internal headers.
  if (c.req.method === 'OPTIONS') {
    await next()
    return undefined
  }

  if (isAllowlistedPath(c.req.path)) {
    await next()
    return undefined
  }

  const configuredSecret = process.env.HERALD_INTERNAL_API_KEY
  if (!configuredSecret) {
    return c.json<APIResponse>(unauthorizedResponse, 401)
  }

  const internalKey = c.req.header('x-herald-internal-api-key')
  if (internalKey !== configuredSecret) {
    return c.json<APIResponse>(unauthorizedResponse, 401)
  }

  await next()
  return undefined
})

export default internalApiKeyMiddleware
