import type { APIResponse } from '@herald/types'
import { Hono } from 'hono'

import { sessionService } from '../../services/session.service.js'

const verifySessionRoutes = new Hono()

type VerifySessionPayload = {
  valid: boolean
  user?: unknown
}

const getErrorStatus = (error: unknown): number | null => {
  if (!error || typeof error !== 'object') {
    return null
  }

  const authError = error as {
    status?: number
    statusCode?: number
  }

  return authError.status ?? authError.statusCode ?? null
}

verifySessionRoutes.get('/verify-session', async (c) => {
  try {
    const result = await sessionService.verifySession(c.req.raw.headers)
    const { session, user } = result ?? {}

    if (!session || !user) {
      return c.json<APIResponse<VerifySessionPayload>>(
        {
          success: false,
          error: {
            code: 'SESSION_INVALID',
            message: 'Invalid or expired session',
          },
        },
        401,
      )
    }

    return c.json<APIResponse<VerifySessionPayload>>({
      success: true,
      data: {
        valid: true,
        user,
      },
    })
  } catch (error) {
    // Auth/session failure
    const status = getErrorStatus(error)
    if (status === 401 || status === 403) {
      return c.json<APIResponse<VerifySessionPayload>>(
        {
          success: false,
          error: {
            code: 'SESSION_UNAUTHORIZED',
            message: 'Unauthorized session access',
          },
        },
        401,
      )
    }

    // Unexpected internal failure
    return c.json<APIResponse<VerifySessionPayload>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      500,
    )
  }
})

export default verifySessionRoutes
