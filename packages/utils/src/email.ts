import { Resend } from 'resend'

export function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set. Email not sent.')
    return Promise.resolve()
  }

  const resend = new Resend(apiKey)
  return resend.emails.send({
    from: 'TC Herald <herald@todayscarolinian.com>',
    to,
    subject,
    text,
  })
}
