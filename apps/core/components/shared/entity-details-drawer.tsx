'use client'

import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isMobile: boolean
  title: string
  headerContent: ReactNode
  closeButtonLabel?: string
  children: ReactNode
}

export function EntityDetailsDrawer({
  open,
  onOpenChange,
  isMobile,
  title,
  headerContent,
  closeButtonLabel,
  children,
}: Props) {
  const handleClose = () => onOpenChange(false)

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
                {...(closeButtonLabel ? { 'aria-label': closeButtonLabel } : {})}
              >
                <ChevronRight className="h-6 w-6 text-black" />
              </button>

              {headerContent}

              <div className="mt-2 h-[1px] w-full bg-black opacity-60" />
            </div>
          )}

          <SheetTitle className="font-roboto-condensed pb-0 text-left text-[16px] font-bold text-black">
            {title}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 pb-4">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
