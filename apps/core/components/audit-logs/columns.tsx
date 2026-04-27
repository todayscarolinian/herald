'use client'

import type { AuditLogDTO } from '@herald/types'
import { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'

export const columns: ColumnDef<AuditLogDTO>[] = [
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ row }) => {
      const action = row.getValue('action') as string

      return (
        <Badge className="bg-tc_primary-500 inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium text-white">
          {action}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'performerId',
    header: 'Performer',
    cell: ({ row }) => {
      const performer = row.original.performer

      if (performer) {
        return `${performer.firstName} ${performer.lastName}`.trim() || performer.email
      }

      return row.getValue('performerId') as string
    },
  },
  {
    accessorKey: 'targetId',
    header: 'Target',
    cell: ({ row }) => {
      const target = row.original.target

      if (!target) {
        return row.getValue('targetId') as string
      }

      if (target.type === 'position') {
        return target.data.name
      }

      return `${target.data.firstName} ${target.data.lastName}`.trim() || target.data.email
    },
  },
  {
    accessorKey: 'timestamp',
    header: 'Timestamp',
  },
]
