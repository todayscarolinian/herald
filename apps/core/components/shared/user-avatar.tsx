import { User as UserIcon } from 'lucide-react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

interface UserAvatarProps {
  user?: {
    firstName?: string
    lastName?: string
    profilePictureURL?: string
  } | null
  size?: number
  className?: string
}

function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase()
}

export function UserAvatar({ user, size = 40, className }: UserAvatarProps) {
  const initials = getInitials(user?.firstName, user?.lastName)

  if (user?.profilePictureURL) {
    return (
      <Image
        src={user.profilePictureURL}
        alt={initials ? `${initials} avatar` : 'User avatar'}
        width={size}
        height={size}
        className={cn('flex-none rounded-full object-cover', className)}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className={cn(
        'bg-tc_primary-500 flex flex-none items-center justify-center rounded-full text-white',
        className
      )}
      style={{ width: size, height: size }}
    >
      {initials ? (
        <span className="text-sm font-semibold" style={{ fontSize: Math.max(size * 0.36, 10) }}>
          {initials}
        </span>
      ) : (
        <UserIcon className="h-1/2 w-1/2" />
      )}
    </div>
  )
}
