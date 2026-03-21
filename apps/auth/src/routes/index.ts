import { HealthStatus, IndexResponse } from '@herald/types'
import { Hono } from 'hono'

import forgotPasswordRoutes from './forgot-password/index.ts'

const app = new Hono()
const serviceName = 'herald-auth'
const serviceVersion = '1.0.0'
const serviceDescription =
    "Today's Carolinian centralized authentication service for SSO, session management, and user identity workflows."
  
const endpoints = {
  health: '/health',
  forgotPassword: '/auth/forgot-password',
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

app.route('/auth', forgotPasswordRoutes)

export default app
