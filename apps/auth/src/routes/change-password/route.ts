import type { APIResponse } from '@herald/types'
import {
  changePasswordSchema,
  isValidPassword,
  PASSWORD_STRENGTH_REQUIREMENTS,
} from '@herald/utils'
import { Hono } from 'hono'

import { authService } from '../../services/auth.service.ts'

const app = new Hono()

app.post('/change-password', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json<APIResponse>(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      400
    )
  }

  const result = changePasswordSchema.safeParse(body)
  if (!result.success) {
    const errorDetails = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }))
    const message = errorDetails.map((d) => `${d.field}: ${d.message}`).join(', ')
    return c.json<APIResponse>(
      { success: false, error: { code: 'VALIDATION_ERROR', message }, data: errorDetails },
      422
    )
  }

  const { currentPassword, newPassword } = result.data

  if (!isValidPassword(newPassword)) {
    return c.json<APIResponse>(
      { success: false, error: { code: 'WEAK_PASSWORD', message: PASSWORD_STRENGTH_REQUIREMENTS } },
      400
    )
  }

  const res = await authService.changePassword(currentPassword, newPassword, c.req.raw.headers)

  if (!res.success) {
    if (res.code === 'INVALID_CREDENTIALS' || res.code === 'UNAUTHORIZED') {
      return c.json<APIResponse>(
        {
          success: false,
          error: {
            code: res.code,
            message:
              res.code === 'INVALID_CREDENTIALS'
                ? 'Current password is incorrect'
                : 'No valid session — please log in again',
          },
        },
        401
      )
    }

    console.error('[change-password] Service error:', res.code)
    return c.json<APIResponse>(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      500
    )
  }

  return c.json<APIResponse>(
    { success: true, data: { message: 'Password changed successfully' } },
    200
  )
})

export default app
