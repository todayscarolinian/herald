'use client'

import { PositionDTO } from '@herald/types'

import { Card, CardContent, CardHeader } from '@/components/ui/card'

type Props = {
  position: PositionDTO
  onClick?: () => void
}

export function PositionCard({ position, onClick }: Props) {
  return (
    <Card
      onClick={onClick}
      className="mb-5 flex h-[83px] cursor-pointer flex-col justify-center gap-2 overflow-hidden bg-white p-0 shadow-md transition"
    >
      <CardHeader className="px-4 py-0">
        <div className="flex min-w-0 items-baseline gap-1">
          <h3 className="text-foreground font-roboto-condensed truncate text-base font-bold">
            {position.name}
          </h3>
          <span className="text-tc_grayscale-800 text-muted-foreground shrink-0 text-[10px] whitespace-nowrap">
            {position.abbreviation}
          </span>
        </div>
      </CardHeader>

      <CardContent className="text-muted-foreground flex justify-between gap-4 px-4 py-0 text-sm">
        <span className="text-tc_grayscale-800 shrink-0 whitespace-nowrap">
          {position.userCount} {position.userCount === 1 ? 'user' : 'users'}
        </span>

        <span className="text-tc_grayscale-800 min-w-0 truncate text-right">
          created {position.createdAt}
        </span>
      </CardContent>
    </Card>
  )
}
