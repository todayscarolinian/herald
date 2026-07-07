import type { APIResponse } from '@herald/types'
import { Hono } from 'hono'
import { z } from 'zod'

import { UNEXPECTED_ERROR_MESSAGE } from '../../lib/error-messages.ts'
import { parseAndValidateBody } from '../../lib/parse-body.ts'
import { authService } from '../../services/auth.service.ts'

const app = new Hono()

const sendWelcomeEmailSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  temporaryPassword: z.string().min(1, 'Temporary password is required'),
})

app.post('/send-welcome-email', async (c) => {
  const parsedBody = await parseAndValidateBody(c, sendWelcomeEmailSchema)
  if (!parsedBody.ok) {
    return parsedBody.response
  }

  const { userId, temporaryPassword } = parsedBody.data
  const result = await authService.sendWelcomeEmail(userId, temporaryPassword)

  if (!result.success) {
    if (result.code === 'EMAIL_PROVIDER_ERROR') {
      return c.json<APIResponse>(
        {
          success: false,
          error: {
            code: 'EMAIL_PROVIDER_ERROR',
            message: 'Failed to send welcome email through provider',
          },
        },
        502
      )
    }

    return c.json<APIResponse>(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: UNEXPECTED_ERROR_MESSAGE },
      },
      500
    )
  }

  return c.json<APIResponse<{ message: string }>>(
    {
      success: true,
      data: { message: 'Welcome email sent successfully' },
    },
    200
  )
})

export default app
