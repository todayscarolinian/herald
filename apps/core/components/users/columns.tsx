'use client'

import { Position, UserDTO } from '@herald/types'
import { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate } from '@/lib/utils'

const MAX_VISIBLE_POSITIONS = 3

export const columns: ColumnDef<UserDTO>[] = [
  {
    accessorKey: 'name',
    header: 'User',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span>{row.getValue('name')}</span>
        {row.original.disabled && (
          <Badge className="bg-tc_error-500/10 text-tc_error-600 dark:text-tc_error-400 inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium">
            Disabled
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    id: 'positions',
    accessorFn: (row) => row.positions,
    header: 'Position',
    filterFn: (row, columnId, filterValue: string[]) => {
      if (!filterValue?.length) {
        return true
      }
      const positions: Position[] = row.getValue(columnId)
      return positions.some((p) => filterValue.includes(p.id))
    },
    cell: ({ row }) => {
      const positions: Position[] = row.getValue('positions')
      const visible = positions.slice(0, MAX_VISIBLE_POSITIONS)
      const overflow = positions.slice(MAX_VISIBLE_POSITIONS)

      return (
        <div className="flex w-full flex-nowrap items-center gap-2">
          {visible.map((p) => (
            <Badge
              key={p.id}
              className="bg-tc_primary-500 inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
            >
              {p.abbreviation}
            </Badge>
          ))}
          {overflow.length > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Badge className="bg-muted text-muted-foreground inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium" />
                }
              >
                +{overflow.length}
              </TooltipTrigger>
              <TooltipContent>{overflow.map((p) => p.name).join(', ')}</TooltipContent>
            </Tooltip>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created on',
    cell: ({ row }) => formatDate(row.getValue('createdAt')),
  },
  {
    accessorKey: 'disabled',
    enableHiding: true,
    filterFn: (row, columnId, filterValue: boolean) => {
      return row.getValue(columnId) === filterValue
    },
  },
  {
    accessorKey: 'emailVerified',
    enableHiding: true,
    filterFn: (row, columnId, filterValue: boolean) => {
      return row.getValue(columnId) === filterValue
    },
  },
]
