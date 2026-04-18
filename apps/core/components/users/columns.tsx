'use client'

import { Position, UserDTO } from '@herald/types'
import { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'

export const columns: ColumnDef<UserDTO>[] = [
  {
    accessorKey: 'firstName',
    header: 'User',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    id: 'positions',
    accessorFn: (row) => row.positions,
    header: 'Position',
    cell: ({ row }) => {
      const positions: Position[] = row.getValue('positions')
      return (
        <div className="flex w-full flex-wrap gap-2">
          {positions.map((p) => (
            <Badge
              key={p.id}
              className="bg-tc_primary-500 inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
            >
              {p.abbreviation}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created on',
  },
]
