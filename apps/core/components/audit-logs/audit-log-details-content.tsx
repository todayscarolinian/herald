'use client'

import type { AuditLogDTO } from '@herald/types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'

type Props = {
  auditLog: AuditLogDTO | null
  onClose: () => void
}

export function AuditLogDetailsContent({ auditLog, onClose }: Props) {
  if (!auditLog) {
    return null
  }

  const performerLabel = auditLog.performer
    ? `${auditLog.performer.firstName} ${auditLog.performer.lastName}`.trim() ||
      auditLog.performer.email
    : auditLog.performerId

  const targetLabel = (() => {
    if (!auditLog.target) {
      return auditLog.targetId
    }

    if (auditLog.target.type === 'position') {
      return auditLog.target.data.name
    }

    return (
      `${auditLog.target.data.firstName} ${auditLog.target.data.lastName}`.trim() ||
      auditLog.target.data.email
    )
  })()

  return (
    <div className="font-roboto flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-1 pb-4">
        <Badge className="bg-tc_primary-500 text-white">{auditLog.action}</Badge>

        <Field orientation="horizontal" className="justify-between border-b pb-2">
          <FieldLabel>Audit Log ID</FieldLabel>
          <span className="text-sm text-black">{auditLog.id}</span>
        </Field>

        <Field orientation="horizontal" className="justify-between border-b pb-2">
          <FieldLabel>Timestamp</FieldLabel>
          <span className="text-sm text-black">{auditLog.timestamp}</span>
        </Field>

        <Field orientation="horizontal" className="justify-between border-b pb-2">
          <FieldLabel>Performer</FieldLabel>
          <span className="text-sm text-black">{performerLabel}</span>
        </Field>

        <Field orientation="horizontal" className="justify-between border-b pb-2">
          <FieldLabel>Target</FieldLabel>
          <span className="text-sm text-black">{targetLabel}</span>
        </Field>

        <Field orientation="horizontal" className="justify-between">
          <FieldLabel>Target Type</FieldLabel>
          <span className="text-sm text-black">{auditLog.target?.type ?? 'unknown'}</span>
        </Field>
      </div>

      <div className="bg-background mt-auto pt-4">
        <Button variant="outline" className="w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
