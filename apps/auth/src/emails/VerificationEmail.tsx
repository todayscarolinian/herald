/** @jsxImportSource react */
import { Heading, Text } from '@react-email/components'

import { AlertBox } from './components/AlertBox.tsx'
import { EmailButton } from './components/EmailButton.tsx'
import { EmailLayout } from './components/EmailLayout.tsx'

type VerificationEmailProps = {
  name: string
  url: string
}

export function VerificationEmail({ name, url }: VerificationEmailProps) {
  return (
    <EmailLayout previewText="Verify your email address to finish setting up Herald">
      <Text style={{ margin: '0 0 14px 0', fontSize: 15 }}>Hi {name},</Text>

      <Heading
        as="h1"
        style={{ margin: '0 0 14px 0', fontSize: 28, lineHeight: '1.2', color: '#111827' }}
      >
        Verify your email
      </Heading>

      <Text style={{ margin: '0 0 22px 0', fontSize: 16 }}>
        Please confirm this is your email address so we can finish setting up your Herald account.
      </Text>

      <Text style={{ margin: '0 0 22px 0' }}>
        <EmailButton href={url}>Verify Email</EmailButton>
      </Text>

      <AlertBox title="Didn't request this?">
        If you weren&apos;t expecting this email, you can safely ignore it. Your account has not
        been changed.
      </AlertBox>
    </EmailLayout>
  )
}

export default VerificationEmail
