import { HealthStatus, IndexResponse } from '@herald/types'
import { Hono } from 'hono'

import { sessionService } from '../services/auth.service.js'

const app = new Hono()
const serviceName = 'herald-auth'
const serviceVersion = '1.0.0'
const serviceDescription =
    "Today's Carolinian centralized authentication service for SSO, session management, and user identity workflows."
  
const endpoints = {
  health: '/health',
  verifySession: '/verify-session',
}

app.get('/', (c) => {
  return c.json<IndexResponse>({
    service: serviceName,
    version: serviceVersion,
    status: 'ok',
    summary: serviceDescription,
    endpoints,
    timestamp: new Date().toISOString(),
  })
})

app.get('/health', (c) => {
  return c.json<HealthStatus>({
    status: 'ok',
    service: serviceName,
    version: serviceVersion,
    timestamp: new Date().toISOString(),
  })
})

app.get('/verify-session', async (c) => {
  try {
    const session = await sessionService.verifySession(c.req.raw.headers)

    if (!session?.session || !session.user) {
      return c.json({ valid: false }, 401)
    }

    return c.json({ valid: true, user: session.user })
  } catch {
    return c.json({ valid: false }, 401)
  }
})

export default app
