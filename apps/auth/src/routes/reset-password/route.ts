import { APIResponse } from '@herald/types'
import { resetPasswordSchema } from '@herald/utils'
import { isValidPassword, PASSWORD_STRENGTH_REQUIREMENTS } from '@herald/utils'
import { Hono } from 'hono'

import { authService } from '../../services/auth.service.ts'

const app = new Hono()
app.post('/reset-password', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json<APIResponse>(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      400
    )
  }

  const result = resetPasswordSchema.safeParse(body)

  if (!result.success) {
    const errorDetails = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }))
    const message = errorDetails.map((d) => `${d.field}: ${d.message}`).join(', ')
    return c.json<APIResponse>(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message },
        data: errorDetails,
      },
      422
    )
  }

  const { token, newPassword } = result.data

  /* Validate password strength  */
  if (!isValidPassword(newPassword)) {
    return c.json<APIResponse>(
      {
        success: false,
        error: { code: 'WEAK_PASSWORD', message: PASSWORD_STRENGTH_REQUIREMENTS },
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
