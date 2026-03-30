import { Hono } from 'hono'
import { logger } from 'hono/logger'

import corsMiddleware from './middleware/cors.ts'
import routes from './routes/index.ts'

const app = new Hono()

app.use('*', logger())
app.use('*', corsMiddleware)

app.route('/', routes)

export default app
