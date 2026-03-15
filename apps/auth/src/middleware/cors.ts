import { cors } from 'hono/cors'

const origin = [
  'https://*.todayscarolinian.com',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
]

const corsMiddleware = cors({
  origin,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
})

export default corsMiddleware
