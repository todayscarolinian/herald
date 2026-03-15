import { Hono } from 'hono'
import { logger } from 'hono/logger'

import { auth } from './lib/auth.ts'
import corsMiddleware from './middleware/cors.ts'
import routes from './routes/index.ts'

const app = new Hono()

app.use('*', logger())
app.use('*', corsMiddleware)

app.route('/', routes)

app.on(['POST', 'GET'], '/*', (c) => {
  return auth.handler(c.req.raw)
})

export default app
