'use client'

import { Position, UserDTO } from '@herald/types'
import { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export const columns: ColumnDef<UserDTO>[] = [
  {
    accessorKey: 'name',
    header: 'User',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span>{row.getValue('name')}</span>
        {row.original.disabled && (
          <Badge className="inline-flex items-center justify-center rounded-md bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
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
      if (!filterValue?.length) {return true}
      const positions: Position[] = row.getValue(columnId)
      return positions.some((p) => filterValue.includes(p.id))
    },
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
