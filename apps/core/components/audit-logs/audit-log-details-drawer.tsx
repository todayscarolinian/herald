'use client'

import type { AuditLogDTO } from '@herald/types'
import { ChevronRight } from 'lucide-react'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={[
          'flex flex-col overflow-hidden bg-white p-0',
          'border-[1px] border-black/40',
          !isMobile && '[&>button]:hidden',
          isMobile ? 'h-[92vh] rounded-t-[8px]' : 'h-full rounded-l-[8px]',
        ].join(' ')}
        style={{
          width: isMobile ? '100%' : '490px',
          maxWidth: isMobile ? '100%' : '490px',
        }}
      >
        <SheetHeader className="font-roboto px-4 pt-4 pb-0">
          {!isMobile && (
            <div className="mb-4 flex flex-col gap-[10px] text-left">
              <button
                onClick={handleClose}
                className="hover:bg-tc_grayscale-100 -ml-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md opacity-60 transition-all hover:opacity-100"
                aria-label="Close details"
              >
                <ChevronRight className="h-6 w-6 text-black" />
              </button>

              <h2 className="font-roboto-condensed text-[24px] leading-tight font-bold text-black">
                {auditLog.action}
              </h2>

              <div className="text-tc_grayscale-800 flex items-center justify-between text-[14px]">
                <span>target {auditLog.target?.type ?? 'unknown'}</span>
                <span>{auditLog.timestamp}</span>
              </div>

              <div className="mt-2 h-[1px] w-full bg-black opacity-60" />
            </div>
          )}

          <SheetTitle className="font-roboto-condensed pb-0 text-left text-[16px] font-bold text-black">
            Audit Log Details
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <AuditLogDetailsContent key={auditLog.id} auditLog={auditLog} onClose={handleClose} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
