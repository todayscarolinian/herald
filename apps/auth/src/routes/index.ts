import { HealthStatus } from '@herald/types'
import { Hono } from 'hono'
const app = new Hono()

const welcomeStrings = [
  'Hello Hono!',
  'To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/backend/hono',
]
const port = parseInt(process.env.PORT || '3001')

app.get('/', (c) => {
  console.log(`🚀 Herald Auth running on http://localhost:${port}`)
  return c.text(welcomeStrings.join('\n\n'))
})

app.get('/health', (c) => {
  return c.json<HealthStatus>({
    status: 'ok',
    service: 'herald-auth',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

export default app
