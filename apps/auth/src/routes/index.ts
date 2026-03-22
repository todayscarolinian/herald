import { HealthStatus, IndexResponse } from '@herald/types'
import { Hono } from 'hono'

const app = new Hono()
const serviceName = 'herald-auth'
const serviceVersion = '1.0.0'
const serviceDescription =
    "Today's Carolinian centralized authentication service for SSO, session management, and user identity workflows."
  
const endpoints = {
  health: '/health',
  'login/credentials': '/auth/login/credentials',
  'login/google': '/auth/login/google',
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

export default app
