'use client'

import { PermissionDTO } from '@herald/types'
import { FolderOpen, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  columns,
  PermissionBreadcrumbs,
  PermissionDataTable,
  PermissionDetailsDrawer,
  PermissionMobileDatagrid,
} from '@/components/permissions'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/hooks/use-mobile'
import { usePermissions } from '@/lib/api/queries/permissionQueries'

export default function PermissionsPage() {
  const isMobile = useIsMobile()
  const [selectedPermission, setSelectedPermission] = useState<PermissionDTO | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const { data, isLoading, isError, error, refetch } = usePermissions({
    filters: {},
    pagination: { page: 1, limit: 200 },
  })

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message)
    }
  }, [isError, error])

  const handleOpenDetails = (permission: PermissionDTO) => {
    setSelectedPermission(permission)
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
          <p className="text-muted-foreground text-sm">Failed to load permissions.</p>
          <Button variant="outline" onClick={() => void refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )
    }

    const permissions = data?.items ?? []

    if (permissions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <FolderOpen className="text-muted-foreground h-10 w-10" />
          <p className="text-lg font-semibold">No permissions yet</p>
          <p className="text-muted-foreground text-sm">No permissions have been configured.</p>
        </div>
      )
    }

    if (isMobile) {
      return <PermissionMobileDatagrid permissions={data!} onClick={handleOpenDetails} />
    }

    return (
      <PermissionDataTable columns={columns} data={permissions} onRowClick={handleOpenDetails} />
    )
  }

  return (
    <main className="flex w-full max-w-none flex-col p-6 pb-0">
      <PermissionBreadcrumbs />

      <div className="flex w-full items-center justify-between p-2 pl-4">
        <span className="text-2xl font-extrabold">Permissions</span>
      </div>

      <div className="mt-8 mb-10 h-full w-full rounded-lg">{renderContent()}</div>

      <PermissionDetailsDrawer
        permission={selectedPermission}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        isMobile={isMobile}
      />
    </main>
  )
}
