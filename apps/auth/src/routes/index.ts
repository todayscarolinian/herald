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

const getErrorStatus = (error: unknown): number | null => {
  if (!error || typeof error !== 'object') {
    return null
  }

  const authError = error as {
    status?: number
    statusCode?: number
  }

  return authError.status ?? authError.statusCode ?? null
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
    const result = await sessionService.verifySession(c.req.raw.headers)
    const { session, user } = result ?? {}

    if (!session || !user) {
      return c.json({ valid: false }, 401)
    }

    return c.json({ valid: true, user })
  } catch (error) {
    // Auth/session failure
    const status = getErrorStatus(error)
    if (status === 401 || status === 403) {
      return c.json({ valid: false }, 401)
    }

    // Unexpected internal failure
    return c.json({ valid: false }, 500)
  }
})

export default app
