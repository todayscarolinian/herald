import { APIResponse } from '@herald/types'
import { createAdminFirebaseUserRepository, forgotPasswordSchema } from '@herald/utils'
import { isAPIError } from 'better-auth/api'
import { Hono } from 'hono'

import { adminAuditLogService } from '../../lib/audit-log.ts'
import { auth } from '../../lib/auth.ts'
import { UNEXPECTED_ERROR_MESSAGE } from '../../lib/error-messages.ts'
import { firestore } from '../../lib/firestore.ts'
import { parseAndValidateBody } from '../../lib/parse-body.ts'

const app = new Hono()

app.post('/forgot-password', async (c) => {
  const parsedBody = await parseAndValidateBody(c, forgotPasswordSchema)
  if (!parsedBody.ok) {
    return parsedBody.response
  }
  const { email } = parsedBody.data

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
        error: { code: 'INTERNAL_ERROR', message: UNEXPECTED_ERROR_MESSAGE },
      },
      500
    )
  }

  const existingUser = await createAdminFirebaseUserRepository(firestore).findByEmail(email)
  if (existingUser) {
    adminAuditLogService.log('USER_PASSWORD_RESET_REQUESTED', null, existingUser.id)
  }

  return c.json<APIResponse>({
    success: true,
    data: {
      message: 'If an account with that email exists, a password reset link has been sent.',
    },
  })
})

export default app
