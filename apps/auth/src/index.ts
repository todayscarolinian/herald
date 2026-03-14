import 'dotenv/config'

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'

import { auth } from './lib/auth.ts'
import corsMiddleware from './middleware/cors.ts'
import routes from './routes/index.ts'

const app = new Hono()
const port = parseInt(process.env.PORT || '3001')

// Middleware
app.use('*', logger())
app.use('*', corsMiddleware)

// Routes
app.route('/', routes)

app.on(['POST', 'GET'], '/*', (c) => {
  return auth.handler(c.req.raw)
})

serve({
  fetch: app.fetch,
  port,
})
