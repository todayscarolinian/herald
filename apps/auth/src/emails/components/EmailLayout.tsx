/** @jsxImportSource react */
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'

import { emailTheme, getHeraldLogoUrl } from '../theme.ts'

type EmailLayoutProps = {
  previewText: string
  children: ReactNode
}

export function EmailLayout({ previewText, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: emailTheme.secondary[300], margin: 0, padding: '32px 16px' }}>
        <Container
          style={{
            maxWidth: 620,
            margin: '0 auto',
            padding: '8px 4px',
            fontFamily: 'Arial, sans-serif',
            color: emailTheme.text,
            lineHeight: 1.6,
          }}
        >
          <Section style={{ textAlign: 'center', marginBottom: 28 }}>
            <Img
              src={getHeraldLogoUrl()}
              alt="TC Herald"
              width={96}
              height={96}
              style={{ display: 'inline-block', objectFit: 'contain' }}
            />
          </Section>

          {children}

          <Hr style={{ margin: '24px 0 16px 0', borderColor: emailTheme.secondary[400] }} />

          <Text style={{ margin: '0 0 8px 0' }}>Go be great,</Text>
          <Text style={{ margin: '0 0 4px 0', fontWeight: 700 }}>The TC Herald Team</Text>
          <Text style={{ margin: 0 }}>Contact Email: todayscarolinianusc.dev@gmail.com</Text>
        </Container>
      </Body>
    </Html>
  )
}
