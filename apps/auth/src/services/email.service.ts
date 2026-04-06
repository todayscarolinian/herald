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
    userName: string
  ) {
    const result = await resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Welcome to Herald!',
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
    const logoUrl = this.getHeraldLogoUrl()
    const onboardingUrl = this.getOnboardingUrl()
    const escapeOnboardingUrl = this.htmlEscape(onboardingUrl)

    return `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 620px; margin: 0 auto; padding: 8px 4px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <img
            src="${logoUrl}"
            alt="TC Herald"
            width="96"
            height="96"
            style="display: inline-block; width: 96px; height: 96px; object-fit: contain;"
          />
        </div>

        <p style="margin: 0 0 14px 0; font-size: 15px;">Hi ${escapeName},</p>

        <h1 style="margin: 0 0 14px 0; font-size: 28px; line-height: 1.2; color: #111827;">Welcome to Herald</h1>

        <p style="margin: 0 0 16px 0; font-size: 16px;">
          Herald is the account you will use across Today's Carolinian's digital tools. It keeps access simple, helps us recognize you across services, and gives you one place to manage the identity details connected to your role.
        </p>

        <div style="margin: 0 0 18px 0; padding: 14px 16px; border: 1px solid #fca5a5; border-left: 5px solid #b91c1c; border-radius: 10px; background: #fff1f2;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; letter-spacing: 0.02em; color: #7f1d1d; text-transform: uppercase;">
            Important: Verify your email first
          </p>
          <p style="margin: 0; font-size: 15px; color: #7f1d1d;">
            You will receive a separate email to confirm your email address. Please confirm it first, then continue to onboarding. Verification is required before you can proceed.
          </p>
        </div>

        <p style="margin: 0 0 16px 0; font-size: 16px;">
          Your temporary password is included below for first access. After confirming your email, head to the onboarding page to finish your setup and learn what comes next.
          <br />
          <strong style="display: inline-block; margin-top: 6px; font-size: 18px; letter-spacing: 0.02em;">${escapePassword}</strong>
        </p>

        <p style="margin: 0 0 22px 0;">
          <a
            href="${escapeOnboardingUrl}"
            style="display: inline-block; background: #9f1d20; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 9999px; font-weight: 700; box-shadow: 0 8px 18px rgba(159, 29, 32, 0.18);"
          >
            Go to Onboarding
          </a>
        </p>

        <p style="margin: 0 0 16px 0; font-size: 15px; color: #4b5563;">
          If anything feels unclear, just follow the onboarding steps. That section will walk you through the basics and help you get settled in.
        </p>

        <p style="margin: 0 0 8px 0;">Go be great,</p>
        <p style="margin: 0 0 4px 0;"><strong>The TC Herald Team</strong></p>
        <p style="margin: 0;">Contact Email: todayscarolinianusc.dev@gmail.com</p>
      </div>
    `
  }

  private getHeraldLogoUrl() {
    try {
      const baseCoreUrl = process.env.NEXT_PUBLIC_CORE_URL ?? 'https://herald.todayscarolinian.com'
      return `${baseCoreUrl}/tc-logo-red.png`
    } catch {
      return 'https://herald.todayscarolinian.com/tc-logo-red.png'
    }
  }

  private getOnboardingUrl() {
    try {
      const baseCoreUrl = process.env.NEXT_PUBLIC_CORE_URL ?? 'https://herald.todayscarolinian.com'
      return `${baseCoreUrl}/onboarding`
    } catch {
      return 'https://herald.todayscarolinian.com/onboarding'
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
