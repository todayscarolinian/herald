import { Hono } from 'hono'
import { logger } from 'hono/logger'

import { auth } from './lib/auth.ts'
import corsMiddleware from './middleware/cors.ts'
import routes from './routes/index.ts'
import loginRouter from './routes/login/route.js'
import resetPasswordRoute from './routes/reset-password/route.ts'
import verifySessionRoutes from './routes/verify-session/route.ts'

const app = new Hono()

app.use('*', logger())
app.use('*', corsMiddleware)

app.route('/auth/login', loginRouter)
app.route('/', routes)
app.route('/auth/reset-password', resetPasswordRoute)
app.route('/auth', verifySessionRoutes)

app.on(['POST', 'GET'], '/*', (c) => {
  return auth.handler(c.req.raw)
})

export default app
