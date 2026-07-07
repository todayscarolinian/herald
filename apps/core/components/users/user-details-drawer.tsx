'use client'

import { UserDTO } from '@herald/types'

import { EntityDetailsDrawer } from '@/components/shared/entity-details-drawer'
import { formatDate } from '@/lib/utils'

import { UserDetailsContent } from './user-details-content'

type Props = {
  user: UserDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isMobile: boolean
}

export function UserDetailsDrawer({ user, open, onOpenChange, isMobile }: Props) {
  const handleClose = () => onOpenChange(false)

  if (!user) {
    return null
  }

  return (
    <EntityDetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      isMobile={isMobile}
      title="User Details"
      headerContent={
        <>
          <h2 className="font-roboto-condensed text-[24px] leading-tight font-bold text-black">
            {user.firstName} {user.lastName}
          </h2>

          <div className="text-tc_grayscale-800 flex items-center justify-between text-[14px]">
            <span>
              {user.positions.length} {user.positions.length === 1 ? 'position' : 'positions'}
            </span>
            <span>created {formatDate(user.createdAt)}</span>
          </div>
        </>
      }
    >
      <UserDetailsContent key={user.id} user={user} onClose={handleClose} />
    </EntityDetailsDrawer>
  )
}
