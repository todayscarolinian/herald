'use client'

import type { AuditLogDTO } from '@herald/types'

import { EntityDetailsDrawer } from '@/components/shared/entity-details-drawer'

import { AuditLogDetailsContent } from './audit-log-details-content'

type Props = {
  auditLog: AuditLogDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isMobile: boolean
}

export function AuditLogDetailsDrawer({ auditLog, open, onOpenChange, isMobile }: Props) {
  const handleClose = () => onOpenChange(false)

  if (!auditLog) {
    return null
  }

  return (
    <EntityDetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      isMobile={isMobile}
      title="Audit Log Details"
      closeButtonLabel="Close details"
      headerContent={
        <>
          <h2 className="font-roboto-condensed text-[24px] leading-tight font-bold text-black">
            {auditLog.action}
          </h2>

          <div className="text-tc_grayscale-800 flex items-center justify-between text-[14px]">
            <span>target {auditLog.target?.type ?? 'unknown'}</span>
            <span>{auditLog.timestamp}</span>
          </div>
        </>
      }
    >
      <AuditLogDetailsContent key={auditLog.id} auditLog={auditLog} onClose={handleClose} />
    </EntityDetailsDrawer>
  )
}
