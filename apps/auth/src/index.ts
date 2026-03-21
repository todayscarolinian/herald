import { Hono } from 'hono'
import { logger } from 'hono/logger'

import { auth } from './lib/auth.ts'
import corsMiddleware from './middleware/cors.ts'
import routes from './routes/index.ts'
import authRoutes from './routes/reset-password/auth.ts'

const app = new Hono()

app.use('*', logger())
app.use('*', corsMiddleware)

app.route('/', routes)
app.route('/auth/', authRoutes)

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

export default app
