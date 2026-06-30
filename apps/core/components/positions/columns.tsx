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
    id: 'permissions',
    accessorKey: 'permissions',
    enableHiding: true,
    enableSorting: false,
    filterFn: (row, _columnId, filterValue) => {
      const selectedPermissions = Array.isArray(filterValue) ? (filterValue as string[]) : []

      if (selectedPermissions.length === 0) {
        return true
      }

      const rowPermissions = (row.getValue('permissions') as string[] | undefined) ?? []
      return selectedPermissions.some((permission) => rowPermissions.includes(permission))
    },
  },
]
