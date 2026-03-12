import { Hono } from 'hono'
const app = new Hono()

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'herald-auth',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

export default app
