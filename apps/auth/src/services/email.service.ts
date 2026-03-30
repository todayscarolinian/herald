import { resend } from '../lib/resend.ts'

type VerificationEmailUser = {
  email: string
  name?: string | null
  firstName?: string
  middleName?: string
  lastName?: string
}

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

  async sendVerificationEmail(user: VerificationEmailUser, url: string) {
    const result = await resend.emails.send({
      from: this.fromEmail,
      to: user.email,
      subject: 'Verify Your Email Address',
      html: this.getVerificationTemplate(user, url),
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

  private getVerificationTemplate(user: VerificationEmailUser, url: string) {
    const fullName = [user.firstName, user.middleName, user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim()
    const recipientName = fullName || user.name?.trim() || user.email
    const escapeName = this.htmlEscape(recipientName)
    const escapeUrl = this.htmlEscape(url)

    return `
            <h1>Welcome to Herald, ${escapeName}!</h1>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${escapeUrl}">Verify Email</a>
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
