'use client'

import { PositionDTO } from '@herald/types'

import { EntityDetailsDrawer } from '@/components/shared/entity-details-drawer'
import { formatDate } from '@/lib/utils'

import { PositionDetailsContent } from './position-details-content'

type Props = {
  position: PositionDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isMobile: boolean
}

export function PositionDetailsDrawer({ position, open, onOpenChange, isMobile }: Props) {
  const handleClose = () => onOpenChange(false)

  if (!position) {
    return null
  }

  return (
    <EntityDetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      isMobile={isMobile}
      title="Position Details"
      headerContent={
        <>
          <h2 className="font-roboto-condensed text-[24px] leading-tight font-bold text-black">
            {position.name}
          </h2>

          <div className="text-tc_grayscale-800 flex items-center justify-between text-[14px]">
            <span>
              {position.userCount} {position.userCount === 1 ? 'user' : 'users'}
            </span>
            <span>created {formatDate(position.createdAt)}</span>
          </div>
        </>
      }
    >
      <PositionDetailsContent key={position.id} position={position} onClose={handleClose} />
    </EntityDetailsDrawer>
  )
}
