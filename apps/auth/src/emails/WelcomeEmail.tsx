/** @jsxImportSource react */
import { Heading, Text } from '@react-email/components'

import { AlertBox } from './components/AlertBox.tsx'
import { EmailButton } from './components/EmailButton.tsx'
import { EmailLayout } from './components/EmailLayout.tsx'
import { getOnboardingUrl } from './theme.ts'

type WelcomeEmailProps = {
  name: string
  tempPassword: string
}

export function WelcomeEmail({ name, tempPassword }: WelcomeEmailProps) {
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

      <AlertBox title="Important: Verify your email first">
        You will receive a separate email to confirm your email address. Please confirm it first,
        then continue to onboarding. Verification is required before you can proceed.
      </AlertBox>

      <Text style={{ margin: '0 0 16px 0', fontSize: 16 }}>
        Your temporary password is included below for first access. After confirming your email,
        head to the onboarding page to finish your setup and learn what comes next.
        <br />
        <strong
          style={{ display: 'inline-block', marginTop: 6, fontSize: 18, letterSpacing: '0.02em' }}
        >
          {tempPassword}
        </strong>
      </Text>

      <Text style={{ margin: '0 0 22px 0' }}>
        <EmailButton href={getOnboardingUrl()}>Go to Onboarding</EmailButton>
      </Text>

      <Text style={{ margin: '0 0 16px 0', fontSize: 15, color: '#4b5563' }}>
        If anything feels unclear, just follow the onboarding steps. That section will walk you
        through the basics and help you get settled in.
      </Text>
    </EmailLayout>
  )
}

export default WelcomeEmail
