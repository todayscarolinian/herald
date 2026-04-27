'use client'

import type { PermissionDTO } from '@herald/types'
import { ChevronRight } from 'lucide-react'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { PermissionDetailsContent } from './permission-details-content'

type Props = {
  permission: PermissionDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isMobile: boolean
}

export function PermissionDetailsDrawer({ permission, open, onOpenChange, isMobile }: Props) {
  const handleClose = () => onOpenChange(false)

  if (!permission) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'flex flex-col overflow-hidden border-[1px] border-black/40 bg-white p-0',
          !isMobile && '[&>button]:hidden',
          isMobile ? 'h-[92vh] rounded-t-[8px]' : 'h-full rounded-l-[8px]'
        )}
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
                {permission.name}
              </h2>

              <div className="text-tc_grayscale-800 flex items-center justify-between text-[14px]">
                <span>{permission.domain}</span>
                <span>{permission.updatedAt}</span>
              </div>

              <div className="mt-2 h-[1px] w-full bg-black opacity-60" />
            </div>
          )}

          <SheetTitle className="font-roboto-condensed pb-0 text-left text-[16px] font-bold text-black">
            Permission Details
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <PermissionDetailsContent
            key={permission.id}
            permission={permission}
            onClose={handleClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
