/** @jsxImportSource react */
import { Section, Text } from '@react-email/components'
import type { ReactNode } from 'react'

type AlertBoxProps = {
  title: string
  children: ReactNode
}

export function AlertBox({ title, children }: AlertBoxProps) {
  return (
    <Section
      style={{
        margin: '0 0 18px 0',
        padding: '14px 16px',
        border: '1px solid #fca5a5',
        borderLeft: '5px solid #b91c1c',
        borderRadius: 10,
        backgroundColor: '#fff1f2',
      }}
    >
      <Text
        style={{
          margin: '0 0 8px 0',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '0.02em',
          color: '#7f1d1d',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      <Text style={{ margin: 0, fontSize: 15, color: '#7f1d1d' }}>{children}</Text>
    </Section>
  )
}
