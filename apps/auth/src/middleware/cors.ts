import { cors } from 'hono/cors'

import { ALLOWED_ORIGINS } from '../lib/allowed-origins.ts'

const corsMiddleware = cors({
  origin: ALLOWED_ORIGINS,
  allowHeaders: ['Content-Type', 'Authorization', 'x-herald-internal-api-key'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
})

export default corsMiddleware
