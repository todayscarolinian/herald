import { cors } from 'hono/cors'

const corsMiddleware = cors({
  origin: 'http://localhost:3001',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
})

export default corsMiddleware
