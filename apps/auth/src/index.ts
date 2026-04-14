import { Hono } from 'hono'
import { logger } from 'hono/logger'

import { auth } from './lib/auth.ts'
import { serializeError } from './lib/errors/serialize-error.ts'
import corsMiddleware from './middleware/cors.ts'
import internalApiKeyMiddleware from './middleware/internal-api-key.ts'
import routes from './routes/index.ts'

const app = new Hono()

app.use('*', logger())
app.use('*', corsMiddleware)
app.use('*', internalApiKeyMiddleware)

app.onError((err, c) => {
  const serialized = serializeError(err)

  if (serialized.headers) {
    for (const [name, value] of Object.entries(serialized.headers)) {
      c.header(name, value)
    }
  }

  return c.json(serialized.body, serialized.status)
})

app.route('/', routes)

app.on(['POST', 'GET'], '/*', (c) => {
  return auth.handler(c.req.raw)
})

export default app
