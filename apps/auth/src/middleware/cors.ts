import { cors } from 'hono/cors'

const origin = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

const corsMiddleware = cors({
  origin,
  allowHeaders: ['Content-Type', 'Authorization', 'x-herald-internal-api-key'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
})

export default corsMiddleware
