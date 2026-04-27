'use client'

import { AuditLogDTO } from '@herald/types'

import { Card, CardContent, CardHeader } from '@/components/ui/card'

type Props = {
  auditLog: AuditLogDTO
  onClick?: () => void
}

export function AuditLogCard({ auditLog, onClick }: Props) {
  const target = auditLog.target
  const isUserTarget = target?.type === 'user'
  const primaryLabel = auditLog.action

  const secondaryLabel =
    target?.type === 'user'
      ? `${target.data.positions.length} ${target.data.positions.length === 1 ? 'position' : 'positions'}`
      : target?.type === 'position'
        ? target.data.abbreviation
        : 'Unavailable'

  const detailLeft =
    target?.type === 'user'
      ? target.data.email
      : (auditLog.performer?.email ?? auditLog.performerId)

  const detailRight = isUserTarget ? `created ${target.data.createdAt}` : `at ${auditLog.timestamp}`

  return (
    <Card
      onClick={onClick}
      className="mb-5 flex h-[83px] cursor-pointer flex-col justify-center gap-2 overflow-hidden bg-white p-0 shadow-md transition"
    >
      <CardHeader className="px-4 py-0">
        <div className="flex min-w-0 items-baseline gap-1">
          <h3 className="text-foreground font-roboto-condensed truncate text-base font-bold">
            {primaryLabel}
          </h3>
          <span className="text-tc_grayscale-800 text-muted-foreground shrink-0 text-[10px] whitespace-nowrap">
            {secondaryLabel}
          </span>
        </div>
      </CardHeader>

      <CardContent className="text-muted-foreground flex justify-between gap-4 px-4 py-0 text-sm">
        <span className="text-tc_grayscale-800 shrink-0 whitespace-nowrap">{detailLeft}</span>

        <span className="text-tc_grayscale-800 min-w-0 truncate text-right">{detailRight}</span>
      </CardContent>
    </Card>
  )
}
