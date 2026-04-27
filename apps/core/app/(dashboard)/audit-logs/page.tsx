'use client'

import { AuditLogDTO, AuditLogListDTO } from '@herald/types'
import { createPaginatedResult } from '@herald/utils'
import { useState } from 'react'

import { AuditLogBreadcrumbs, columns, DataTable, MobileDatagrid } from '@/components/audit-logs'
import { AuditLogDetailsDrawer } from '@/components/audit-logs/audit-log-details-drawer'
import { useIsMobile } from '@/hooks/use-mobile'

const MOCK_AUDIT_LOGS: AuditLogDTO[] = [
  {
    id: '1',
    action: 'USER_CREATED',
    performerId: '123',
    targetId: '456',
    timestamp: '2024-01-01T00:00:00Z',
    target: {
      type: 'user',
      data: {
        id: '456',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@gmail.com',
        positions: [],
        createdAt: '2024-01-01T00:00:00Z',
      },
    },
    performer: {
      id: '123',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@gmail.com',
    },
  },
  {
    id: '2',
    action: 'USER_DELETED',
    performerId: '123',
    targetId: '789',
    timestamp: '2024-01-02T00:00:00Z',
    target: null,
    performer: null,
  },
  {
    id: '3',
    action: 'USER_UPDATED',
    performerId: '123',
    targetId: '456',
    timestamp: '2024-01-03T00:00:00Z',
    target: null,
    performer: null,
  },
  {
    id: '4',
    action: 'POSITION_CREATED',
    performerId: '123',
    targetId: '101112',
    timestamp: '2024-01-04T00:00:00Z',
    target: null,
    performer: null,
  },
]

function getData(): AuditLogListDTO {
  return createPaginatedResult(MOCK_AUDIT_LOGS, MOCK_AUDIT_LOGS.length, { page: 1, limit: 10 })
}

export default function AuditLogsPage() {
  const data = getData()
  const isMobile = useIsMobile()
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogDTO | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleOpenDetails = (auditLog: AuditLogDTO) => {
    setSelectedAuditLog(auditLog)
    setIsDrawerOpen(true)
  }

  return (
    <div className="flex w-full max-w-none flex-col p-6 pb-0">
      <AuditLogBreadcrumbs />

      <div className="flex w-full items-center justify-between p-2 pl-4">
        <span className="text-2xl font-extrabold">Audit Logs</span>
      </div>

      <div className="mt-8 mb-10 h-full w-full rounded-lg">
        {isMobile ? (
          <MobileDatagrid auditLogs={data} onClick={handleOpenDetails} />
        ) : (
          <DataTable columns={columns} data={data.items} />
        )}
      </div>

      <AuditLogDetailsDrawer
        auditLog={selectedAuditLog}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        isMobile={isMobile}
      />
    </div>
  )
}
