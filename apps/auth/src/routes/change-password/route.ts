import type { APIResponse } from '@herald/types'
import {
  changePasswordSchema,
  isValidPassword,
  PASSWORD_STRENGTH_REQUIREMENTS,
} from '@herald/utils'
import { Hono } from 'hono'

import { UNEXPECTED_ERROR_MESSAGE } from '../../lib/error-messages.ts'
import { parseAndValidateBody } from '../../lib/parse-body.ts'
import { authService } from '../../services/auth.service.ts'

const app = new Hono()

app.post('/change-password', async (c) => {
  const parsedBody = await parseAndValidateBody(c, changePasswordSchema)
  if (!parsedBody.ok) {
    return parsedBody.response
  }

  const { currentPassword, newPassword } = parsedBody.data

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
        error: { code: 'INTERNAL_ERROR', message: UNEXPECTED_ERROR_MESSAGE },
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
