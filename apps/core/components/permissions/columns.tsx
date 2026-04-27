'use client'

import type { PermissionDTO } from '@herald/types'
import { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'

export const columns: ColumnDef<PermissionDTO>[] = [
  {
    accessorKey: 'name',
    header: 'Permission',
    cell: ({ row }) => (
      <span className="font-roboto-condensed text-base font-semibold">{row.original.name}</span>
    ),
  },
  {
    accessorKey: 'domain',
    header: 'Domain',
    cell: ({ row }) => (
      <Badge className="bg-tc_primary-500 inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium text-white">
        {row.original.domain}
      </Badge>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="line-clamp-1 max-w-[340px] text-sm text-black/80">
        {row.original.description}
      </span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
  },
]
