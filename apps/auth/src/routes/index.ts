import { APIResponse, HealthResponse, IndexResponse } from '@herald/types'
import { Hono } from 'hono'

import forgotPasswordRoutes from './forgot-password/route.ts'
import loginRouter from './login/route.ts'
import { logout } from './logout/route.ts'
import resetPasswordRoute from './reset-password/route.ts'
import verifySessionRoutes from './verify-session/route.ts'

const app = new Hono()
const authRouter = new Hono()
const serviceName = 'herald-auth'
const serviceVersion = '1.0.0'
const serviceDescription =
  "Today's Carolinian centralized authentication service for SSO, session management, and user identity workflows."

const endpoints = {
  health: '/health',
  'login/credentials': '/auth/login/credentials',
  'login/google': '/auth/login/google',
  logout: '/auth/logout',
  verifySession: '/auth/verify-session',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
}

app.get('/', (c) => {
  return c.json<APIResponse<IndexResponse>>({
    success: true,
    data: {
      service: serviceName,
      version: serviceVersion,
      status: 'ok',
      summary: serviceDescription,
      endpoints,
      timestamp: new Date().toISOString(),
    },
  })
})

app.get('/health', (c) => {
  return c.json<APIResponse<HealthResponse>>({
    success: true,
    data: {
      status: 'ok',
      service: serviceName,
      version: serviceVersion,
      timestamp: new Date().toISOString(),
    },
  })
})

// Centralized auth sub-routes mounted under a single /auth endpoint.
authRouter.route('/login', loginRouter)
authRouter.route('/', logout)
authRouter.route('/', forgotPasswordRoutes)
authRouter.route('/', resetPasswordRoute)
authRouter.route('/', verifySessionRoutes)

app.route('/auth', authRouter)

export default app
