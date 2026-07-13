import { PositionDTO } from '@herald/types'
import { ColumnDef } from '@tanstack/react-table'

import { formatDate } from '@/lib/utils'

export const columns: ColumnDef<PositionDTO>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'abbreviation', header: 'Abbreviation' },
  { accessorKey: 'userCount', header: 'User Count' },
  {
    accessorKey: 'createdAt',
    header: 'Created at',
    cell: ({ row }) => formatDate(row.getValue('createdAt')),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated at',
    cell: ({ row }) => formatDate(row.getValue('updatedAt')),
  },
  {
    id: 'domains',
    accessorKey: 'domains',
    enableHiding: true,
    enableSorting: false,
  },
]
