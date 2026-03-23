import { Hono } from 'hono'

import { auth } from '../../lib/auth.ts'

const app = new Hono()

app.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json<{ email?: string }>()

    if (!email || typeof email !== 'string') {
      return c.json({ success: true }, 200)
    }

    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${process.env.NEXT_PUBLIC_CORE_URL}/reset-password`,
      },
      headers: c.req.raw.headers,
    })
  } catch {
    // silently fail to prevent revealing whether account exists
    // TODO: Add logging service
  }

  return c.json({ success: true }, 200)
})

export default app