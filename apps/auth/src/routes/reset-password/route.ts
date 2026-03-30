import { APIResponse } from '@herald/types'
import { resetPasswordSchema } from '@herald/utils'
import { Hono } from 'hono'

import { isValidPassword } from '../../lib/helpers.ts'
import { authService } from '../../services/auth.service.ts'

const app = new Hono()
app.post('/reset-password', async (c) => {
  const body = await c.req.json()
  const result = resetPasswordSchema.safeParse(body)

  if (!result.success) {
    return c.json<APIResponse>(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request body' },
      },
      400
    )
  }

  const { token, newPassword } = result.data

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

  const res = await authService.resetPassword(token, newPassword)

  if (!res.success && res.code) {
    return c.json<APIResponse>(
      {
        success: false,
        error: {
          code: res.code,
          message: res.code === 'AUTH_INVALID' ? 'Invalid or expired link' : 'Something went wrong',
        },
      },
      res.code === 'INTERNAL_ERROR' ? 500 : 400
    )
  }

  return c.json<APIResponse>(
    {
      success: true,
      data: { message: 'Password reset successfully' },
    },
    200
  )
})

export default app
