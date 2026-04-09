import { APIResponse } from '@herald/types'
import { Hono } from 'hono'

import { authService } from '../../services/auth.service.ts'

const app = new Hono()

app.get('/verify-email', async (c) => {
  const token = c.req.query('token')

  if (!token || token.trim() === '') {
    return c.json<APIResponse>(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'token: Token is required' } },
      422
    )
  }

  const res = await authService.verifyEmail(token)

  if (!res.success && res.code) {
    return c.json<APIResponse>(
      {
        success: false,
        data: { emailResent: res.emailResent },
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
      data: { message: 'Email verified successfully' },
    },
    200
  )
})

export default app
