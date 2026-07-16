/** @jsxImportSource react */
import { Heading, Text } from '@react-email/components'

import { AlertBox } from './components/AlertBox.tsx'
import { EmailButton } from './components/EmailButton.tsx'
import { EmailLayout } from './components/EmailLayout.tsx'
import { emailTheme } from './theme.ts'

type PasswordResetEmailProps = {
  url: string
}

export function PasswordResetEmail({ url }: PasswordResetEmailProps) {
  return (
    <EmailLayout previewText="Reset your Herald password">
      <Heading
        as="h1"
        style={{ margin: '0 0 14px 0', fontSize: 28, lineHeight: '1.2', color: '#111827' }}
      >
        Reset your password
      </Heading>

      <Text style={{ margin: '0 0 22px 0', fontSize: 16 }}>
        We received a request to reset the password for your Herald account. Click the button below
        to choose a new password.
      </Text>

      <Text style={{ margin: '0 0 8px 0' }}>
        <EmailButton href={url}>Reset Password</EmailButton>
      </Text>

      <Text style={{ margin: '0 0 22px 0', fontSize: 13, color: emailTheme.grayscale[600] }}>
        This link will expire in 1 hour.
      </Text>

      <AlertBox title="Didn't request this?">
        If you didn&apos;t ask to reset your password, you can safely ignore this email. Your
        password will stay the same.
      </AlertBox>
    </EmailLayout>
  )
}

export default PasswordResetEmail
