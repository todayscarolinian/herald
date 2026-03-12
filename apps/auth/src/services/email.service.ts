import { resend } from '../lib/resend.js'

export class EmailService {
  private fromEmail = 'Herald <noreply@todayscarolinian.com>'

  async sendWelcomeEmail(to: string, tempPassword: string, userName: string) {
    const result = await resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Welcome to Herald',
      html: this.getWelcomeTemplate(userName, tempPassword),
    })
    return result
  }

  async sendPasswordReset(to: string, resetLink: string) {
    const result = await resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Reset Your Password',
      html: this.getPasswordResetTemplate(resetLink),
    })
    return result
  }

  private getWelcomeTemplate(name: string, password: string) {
    return `
      <h1>Welcome to Herald, ${name}!</h1>
      <p>Your temporary password is: <strong>${password}</strong></p>
      <p>Please change it after your first login.</p>
    `
  }

  private getPasswordResetTemplate(link: string) {
    return `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${link}">Reset Password</a>
    `
  }
}

export const emailService = new EmailService()
