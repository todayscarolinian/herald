// src/server.ts
import 'dotenv/config'

import { serve } from '@hono/node-server'

import app from './index.ts'

const port = Number(process.env.PORT ?? 3001)

serve({
  fetch: app.fetch,
  port,
})

console.log(`Auth server listening on http://localhost:${port}`)