import { APIResponse } from '@herald/types'
import { Hono } from 'hono'

import { auth } from '../../lib/auth.ts'

const app = new Hono()

app.post('/send-verification-email', async (c) => {
  const body = await c.req.json<{ email?: string }>()

  if (!body.email || body.email.trim() === '') {
    return c.json<APIResponse>(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'email: Email is required' } },
      422
    )
  }

  try {
    const callbackURL = process.env.HERALD_CORE_URL
    if (!callbackURL) {
      return c.json<APIResponse>(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
        500
      )
    }

    await auth.api.sendVerificationEmail({
      body: { email: body.email, callbackURL: `${callbackURL}/login` },
    })

    return c.json<APIResponse>({ success: true, data: { message: 'Verification email sent' } }, 200)
  } catch {
    return c.json<APIResponse>(
      {
        success: false,
        error: { code: 'SEND_FAILED', message: 'Failed to send verification email' },
      },
      400
    )
  }
})

export default app
