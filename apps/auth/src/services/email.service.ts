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

  async sendWelcomeEmail(
    to: string,
    tempPassword: string,
    userName: string,
    changePasswordLink: string
  ) {
    const result = await resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Welcome to Herald - Change Your Password',
      html: this.getWelcomeTemplate(userName, tempPassword, changePasswordLink),
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

  private getWelcomeTemplate(name: string, password: string, changePasswordLink: string) {
    const escapeName = this.htmlEscape(name)
    const escapePassword = this.htmlEscape(password)
    const escapeChangePasswordLink = this.htmlEscape(changePasswordLink)
    const logoUrl = this.getHeraldLogoUrl(changePasswordLink)

    return `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 620px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img
            src="${logoUrl}"
            alt="TC Herald"
            width="96"
            height="96"
            style="display: inline-block; width: 96px; height: 96px; object-fit: contain;"
          />
        </div>

        <p style="margin: 0 0 16px 0;">Hi ${escapeName},</p>

        <p style="margin: 0 0 16px 0;">It is great to welcome you to <strong>TC Herald</strong>.</p>

        <p style="margin: 0 0 16px 0;">
          As part of Today's Carolinian's digital ecosystem, your Herald account gives you access to a centralized identity experience for TC platforms and services.
        </p>

        <p style="margin: 0 0 16px 0;">
          To get started, please use your temporary password below and update it immediately:
          <br />
          <strong>${escapePassword}</strong>
        </p>

        <p style="margin: 0 0 20px 0;">
          <a
            href="${escapeChangePasswordLink}"
            style="display: inline-block; background: #b91c1c; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-weight: 600;"
          >
            Set Your Password
          </a>
        </p>

        <p style="margin: 0 0 16px 0;">
          If there is any support we can provide along your journey, please do not hesitate to reach out.
        </p>

        <p style="margin: 0 0 8px 0;">Go be great,</p>
        <p style="margin: 0 0 4px 0;"><strong>The TC Herald Team</strong></p>
        <p style="margin: 0;">Contact Email: noreply@todayscarolinian.com</p>
      </div>
    `
  }

  private getHeraldLogoUrl(changePasswordLink: string) {
    try {
      const origin = new URL(changePasswordLink).origin
      return `${origin}/tc-herald-logo.png`
    } catch {
      return 'https://herald.todayscarolinian.com/tc-herald-logo.png'
    }
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
