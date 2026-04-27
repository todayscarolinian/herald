import { Job, Queue, Worker } from 'bullmq'

import { createRedis } from './redis.ts'
import { resend } from './resend.ts'
interface EmailData {
  from: string
  to: string | string[]
  subject: string
  html: string
}

const shouldUseQueue =
  process.env.USE_EMAIL_QUEUE === 'true' && !!process.env.REDIS_HOST && !!process.env.REDIS_PORT

let emailQueue: Queue<EmailData> | null = null

if (shouldUseQueue) {
  const redis = createRedis()
  emailQueue = new Queue<EmailData>('herald-mail', {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000,
      },
      removeOnComplete: {
        age: 86400,
        count: 1000,
      },
      removeOnFail: {
        age: 604800,
      },
    },
  })

  new Worker<EmailData>(
    'herald-mail',
    async (job: Job<EmailData>) => {
      const { from, to, subject, html } = job.data

      const res = await resend.emails.send({
        from,
        to,
        subject,
        html,
      })

      return res
    },
    {
      connection: redis,
      concurrency: 5,
    }
  )
}

export function sendEmail(data: EmailData, jobName?: string) {
  if (shouldUseQueue && emailQueue) {
    return emailQueue.add(jobName ?? 'send-email', data)
  }

  return resend.emails.send(data)
}
