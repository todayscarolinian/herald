import { cors } from 'hono/cors'

const origin = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())

const corsMiddleware = cors({
  origin,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
})

export default corsMiddleware
