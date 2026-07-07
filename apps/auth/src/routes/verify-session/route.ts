import type { APIResponse, VerifySessionResponse } from '@herald/types'
import { createAdminFirebaseUserRepository } from '@herald/utils'
import { isAPIError } from 'better-auth/api'
import { Hono } from 'hono'

import { UNEXPECTED_ERROR_MESSAGE } from '../../lib/error-messages.ts'
import { firestore } from '../../lib/firestore.ts'
import { sessionService } from '../../services/session.service.ts'

const verifySessionRoutes = new Hono()
const userRepository = createAdminFirebaseUserRepository(firestore)

verifySessionRoutes.get('/verify-session', async (c) => {
  try {
    const result = await sessionService.verifySession(c.req.raw.headers)
    const { session, user } = result ?? {}

    if (!session || !user) {
      return c.json<APIResponse<VerifySessionResponse>>(
        {
          success: false,
          error: {
            code: 'SESSION_INVALID',
            message: 'Invalid or expired session',
          },
        },
        401
      )
    }

    // The session cache can serve a signed snapshot of `user` up to 5 minutes
    // stale, so a disable/delete taking effect elsewhere wouldn't be reflected
    // in it yet. Re-check disabled status with a direct (cheap) Firestore doc
    // read rather than trusting the cached value.
    const liveUser = await userRepository.findById(user.id)
    if (!liveUser) {
      return c.json<APIResponse<VerifySessionResponse>>(
        {
          success: false,
          error: { code: 'SESSION_INVALID', message: 'Invalid or expired session' },
        },
        401
      )
    }

    if (liveUser.disabled) {
      return c.json<APIResponse<VerifySessionResponse>>(
        {
          success: false,
          error: { code: 'ACCOUNT_DISABLED', message: 'This account has been disabled' },
        },
        403
      )
    }

    return c.json<APIResponse<VerifySessionResponse>>({
      success: true,
      data: {
        valid: true,
        session: {
          token: session.token,
          expiresAt: session.expiresAt.getTime(),
        },
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          middleName: user.middleName ?? undefined,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
          disabled: user.disabled ?? false,
          positions: user.positions ?? [],
          domains: user.domains ?? [],
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      },
    })
  } catch (error) {
    // Auth/session failure
    if (isAPIError(error) && (error.statusCode === 401 || error.statusCode === 403)) {
      return c.json<APIResponse<VerifySessionResponse>>(
        {
          success: false,
          error: {
            code: 'SESSION_UNAUTHORIZED',
            message: 'Unauthorized session access',
          },
        },
        401
      )
    }

    // Unexpected internal failure
    return c.json<APIResponse<VerifySessionResponse>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: UNEXPECTED_ERROR_MESSAGE,
        },
      },
      500
    )
  }
})

export default verifySessionRoutes
