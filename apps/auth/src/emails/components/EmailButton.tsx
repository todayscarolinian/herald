/** @jsxImportSource react */
import { Button } from '@react-email/components'
import type { ReactNode } from 'react'

import { emailTheme } from '../theme.ts'

type EmailButtonProps = {
  href: string
  children: ReactNode
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Button
      href={href}
      style={{
        display: 'inline-block',
        backgroundColor: emailTheme.primary[600],
        color: emailTheme.white,
        textDecoration: 'none',
        padding: '12px 18px',
        borderRadius: 9999,
        fontWeight: 700,
        boxShadow: '0 8px 18px rgba(155, 38, 38, 0.18)',
      }}
    >
      {children}
    </Button>
  )
}
