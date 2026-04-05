import type { APIResponse } from '@herald/types'
import { Hono } from 'hono'
import { z } from 'zod'

import { authService } from '../../services/auth.service.ts'

const app = new Hono()

const isInternalRequest = (headers: Headers): boolean => {
  const configuredSecret = process.env.HERALD_INTERNAL_API_KEY
  if (!configuredSecret) {
    return false
  }

  const internalKey = headers.get('x-herald-internal-key')
  return internalKey === configuredSecret
}

const sendWelcomeEmailSchema = z.object({
  user: z.object({
    id: z.string().min(1, 'User id is required'),
    email: z.email('Invalid email address'),
    firstName: z.string().optional(),
    middleName: z.string().optional(),
    lastName: z.string().optional(),
    name: z.string().optional(),
  }),
  temporaryPassword: z.string().min(1, 'Temporary password is required'),
})

app.post('/send-welcome-email', async (c) => {
  if (!isInternalRequest(c.req.raw.headers)) {
    return c.json<APIResponse>(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized request' },
      },
      401
    )
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json<APIResponse>(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      400
    )
  }

  const parsed = sendWelcomeEmailSchema.safeParse(body)
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }))
    const message = errorDetails.map((d) => `${d.field}: ${d.message}`).join(', ')

    return c.json<APIResponse<typeof errorDetails>>(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message },
        data: errorDetails,
      },
      422
    )
  }

  const { user, temporaryPassword } = parsed.data
  const result = await authService.sendWelcomeEmail(user, temporaryPassword)

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
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
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
