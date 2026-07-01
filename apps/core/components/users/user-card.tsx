'use client'

import { UserDTO } from '@herald/types'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

type Props = {
  user: UserDTO
  onClick?: () => void
}

export function UserCard({ user, onClick }: Props) {
  return (
    <Card
      onClick={onClick}
      className="mb-5 flex h-[83px] cursor-pointer flex-col justify-center gap-2 overflow-hidden bg-white p-0 shadow-md transition"
    >
      <CardHeader className="px-4 py-0">
        <div className="flex min-w-0 items-baseline gap-1">
          <h3 className="text-foreground font-roboto-condensed truncate text-base font-bold">
            {user.firstName} {user.lastName}
          </h3>
          <span className="text-tc_grayscale-800 text-muted-foreground shrink-0 text-[10px] whitespace-nowrap">
            {user.positions.length} {user.positions.length === 1 ? 'position' : 'positions'}
          </span>
          {user.disabled && (
            <Badge className="bg-tc_error-500/10 text-tc_error-600 dark:text-tc_error-400 inline-flex shrink-0 items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium">
              Disabled
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="text-muted-foreground flex justify-between gap-4 px-4 py-0 text-sm">
        <span className="text-tc_grayscale-800 shrink-0 whitespace-nowrap">{user.email}</span>

        <span className="text-tc_grayscale-800 min-w-0 truncate text-right">
          created {formatDate(user.createdAt)}
        </span>
      </CardContent>
    </Card>
  )
}
