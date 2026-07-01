'use client'

import { AuditLogDTO } from '@herald/types'
import { FolderOpen, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { columns, DataTable, MobileDatagrid } from '@/components/audit-logs'
import { AuditLogDetailsDrawer } from '@/components/audit-logs/audit-log-details-drawer'
import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAuditLogs } from '@/lib/api/queries/auditLogQueries'

export default function AuditLogsPage() {
  const isMobile = useIsMobile()
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogDTO | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const { data, isLoading, isError, error, refetch } = useAuditLogs({
    filters: {},
    pagination: { page: 1, limit: 200 },
  })

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message)
    }
  }, [isError, error])

  const handleOpenDetails = (auditLog: AuditLogDTO) => {
    setSelectedAuditLog(auditLog)
    setIsDrawerOpen(true)
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3 pt-4">
          {Array.from({ length: 8 }, (_, i) => `skeleton-row-${i}`).map((key) => (
            <Skeleton key={key} className="h-10 w-full rounded-md" />
          ))}
        </div>
      )
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-muted-foreground text-sm">Failed to load audit logs.</p>
          <Button variant="outline" onClick={() => void refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )
    }

    const auditLogs = data?.items ?? []

    if (auditLogs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <FolderOpen className="text-muted-foreground h-10 w-10" />
          <p className="text-lg font-semibold">No audit logs yet</p>
          <p className="text-muted-foreground text-sm">Actions will appear here once recorded.</p>
        </div>
      )
    }

    if (isMobile) {
      return <MobileDatagrid auditLogs={data!} onClick={handleOpenDetails} />
    }

    return <DataTable columns={columns} data={auditLogs} onRowClick={handleOpenDetails} />
  }

  return (
    <div className="flex w-full max-w-none flex-col">
      <PageHeader title="Audit Logs" />

      <div className="flex flex-col p-6 pb-0">
        <div className="mt-8 mb-10 h-full w-full rounded-lg">{renderContent()}</div>
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
