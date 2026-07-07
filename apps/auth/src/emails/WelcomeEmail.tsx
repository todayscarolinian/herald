/** @jsxImportSource react */
import { Heading, Text } from '@react-email/components'

import { AlertBox } from './components/AlertBox.tsx'
import { EmailButton } from './components/EmailButton.tsx'
import { EmailLayout } from './components/EmailLayout.tsx'

type WelcomeEmailProps = {
  name: string
  tempPassword: string
  verificationUrl: string
}

export function WelcomeEmail({ name, tempPassword, verificationUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout previewText="Welcome to Herald - verify your email to get started">
      <Text style={{ margin: '0 0 14px 0', fontSize: 15 }}>Hi {name},</Text>

      <Heading
        as="h1"
        style={{ margin: '0 0 14px 0', fontSize: 28, lineHeight: '1.2', color: '#111827' }}
      >
        Welcome to Herald
      </Heading>

      <Text style={{ margin: '0 0 16px 0', fontSize: 16 }}>
        Herald is the account you will use across Today&apos;s Carolinian&apos;s digital tools. It
        keeps access simple, helps us recognize you across services, and gives you one place to
        manage the identity details connected to your role.
      </Text>

      <Text style={{ margin: '0 0 16px 0', fontSize: 16 }}>
        Your temporary password is included below for first access.
        <br />
        <strong
          style={{ display: 'inline-block', marginTop: 6, fontSize: 18, letterSpacing: '0.02em' }}
        >
          {tempPassword}
        </strong>
      </Text>

      <AlertBox title="Verify your email to get started">
        Confirm your email address before signing in. You&apos;ll be asked to set a new password the
        first time you log in.
      </AlertBox>

      <Text style={{ margin: '0 0 22px 0' }}>
        <EmailButton href={verificationUrl}>Verify Email</EmailButton>
      </Text>
    </EmailLayout>
  )
}

export default WelcomeEmail
