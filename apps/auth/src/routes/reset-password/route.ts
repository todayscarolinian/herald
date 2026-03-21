import { APIResponse } from '@herald/types'
import { isAPIError } from 'better-auth/api'
import { Hono } from 'hono'

import { isValidPassword } from '../../lib/helpers.ts'
import { authService } from '../../services/auth.service.ts'

const app = new Hono()

app.post('/', async (c) => {
  const { token, newPassword } = await c.req.json()

  /* Validate existence of parameters  */
  if (!token || !newPassword) {
    return c.json<APIResponse>(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Token or password not provided' },
      },
      400
    )
  }

  /* Validate password strength  */
  if (!isValidPassword(newPassword)) {
    return c.json<APIResponse>(
      {
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password does not meet strength requirements' },
      },
      400
    )
  }

  try {
    await authService.resetPassword(token, newPassword)
    return c.json<APIResponse>(
      {
        success: true,
        data: { message: 'Password reset successfully' },
      },
      200
    )
  } catch (error) {
    console.error('[reset-password]', error)
    if (isAPIError(error) && error?.body?.code === 'INVALID_TOKEN') {
      return c.json<APIResponse>(
        {
          success: false,
          error: { code: 'AUTH_INVALID', message: 'Invalid or expired link' },
        },
        400
      )
    }

    return c.json<APIResponse>(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      500
    )
  }
})

export default app
