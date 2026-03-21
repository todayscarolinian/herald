import { HealthStatus, IndexResponse } from '@herald/types'
import { Hono } from 'hono'

import { passwordService } from '../services/password.service.ts'

const app = new Hono()
const serviceName = 'herald-auth'
const serviceVersion = '1.0.0'
const serviceDescription =
    "Today's Carolinian centralized authentication service for SSO, session management, and user identity workflows."
  
const endpoints = {
  health: '/health',
  forgotPassword: '/forgot-password',
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

app.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json<{ email: string }>()
    await passwordService.requestPasswordReset(email)
  } catch {
    // silently fail to prevent revealing whether account exists
    // TODO: Add logging service
  }
  return c.json({ success: true }, 200)
})

export default app
