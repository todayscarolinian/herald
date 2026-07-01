import { PasswordResetEmail } from '../emails/PasswordResetEmail.tsx'
import { renderEmail } from '../emails/render.ts'
import { VerificationEmail } from '../emails/VerificationEmail.tsx'
import { WelcomeEmail } from '../emails/WelcomeEmail.tsx'
import { sendEmail } from '../lib/email-worker.ts'

type VerificationEmailUser = {
  email: string
  name?: string | null
  firstName?: string
  middleName?: string
  lastName?: string
}

export class EmailService {
  private fromEmail = 'Herald <noreply@todayscarolinian.com>'

  async sendWelcomeEmail(to: string, tempPassword: string, userName: string): Promise<unknown> {
    const html = await renderEmail(WelcomeEmail({ name: userName, tempPassword }))
    const emailResult = await sendEmail(
      {
        from: this.fromEmail,
        to,
        subject: 'Welcome to Herald!',
        html,
      },
      'welcome-email'
    )
    return emailResult
  }

  async sendVerificationEmail(user: VerificationEmailUser, url: string): Promise<unknown> {
    const fullName = [user.firstName, user.middleName, user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim()
    const recipientName = fullName || user.name?.trim() || user.email

    const html = await renderEmail(VerificationEmail({ name: recipientName, url }))
    const emailResult = await sendEmail(
      {
        from: this.fromEmail,
        to: user.email,
        subject: 'Verify Your Email Address',
        html,
      },
      'verification-email'
    )
    return emailResult
  }

  async sendPasswordReset(to: string, resetLink: string): Promise<unknown> {
    const html = await renderEmail(PasswordResetEmail({ url: resetLink }))
    const emailResult = await sendEmail(
      {
        from: this.fromEmail,
        to,
        subject: 'Reset Your Password',
        html,
      },
      'password-email'
    )
    return emailResult
  }
}

export const emailService = new EmailService()
