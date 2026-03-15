import { resend } from '../lib/resend.ts'

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
    const escapeName = this.htmlEscape(name)
    const escapePassword = this.htmlEscape(password)

    return `
      <h1>Welcome to Herald, ${escapeName}!</h1>
      <p>Your temporary password is: <strong>${escapePassword}</strong></p>
      <p>Please change it after your first login.</p>
    `
  }

  private getPasswordResetTemplate(link: string) {
    const escapeLink = this.htmlEscape(link)
    return `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${escapeLink}">Reset Password</a>
    `
  }

  public htmlEscape(str: string) {
    return str.replace(
      /[&<>"']/g,
      (l) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[l] || l
    )
  }
}

export const emailService = new EmailService()
