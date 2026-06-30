'use client'

import { UserDTO } from '@herald/types'
import { FolderOpen, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { columns, CreateButton, DataTable, ImportButton, UserBreadcrumbs } from '@/components/users'
import { BulkImportDialog } from '@/components/users/bulk-import-dialog'
import { UserDetailsDrawer } from '@/components/users/user-details-drawer'
import MobileDatagrid from '@/components/users/user-mobile-datagrid'
import { useIsMobile } from '@/hooks/use-mobile'
import { useUsers } from '@/lib/api/queries/userQueries'

export default function UsersPage() {
  const isMobile = useIsMobile()
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState<null | 'create' | 'update'>(null)

  const { data, isLoading, isError, error, refetch } = useUsers({
    filters: {},
    pagination: { page: 1, limit: 200 },
  })

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message)
    }
  }, [isError, error])

  const handleOpenDetails = (user: UserDTO) => {
    setSelectedUser(user)
    setIsDrawerOpen(true)
  }

  const renderTable = () => {
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
          <p className="text-muted-foreground text-sm">Failed to load users.</p>
          <Button variant="outline" onClick={() => void refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )
    }

    const users = data?.items ?? []

    if (users.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <FolderOpen className="text-muted-foreground h-10 w-10" />
          <p className="text-lg font-semibold">No users yet</p>
          <p className="text-muted-foreground text-sm">Create the first user to get started.</p>
        </div>
      )
    }

    if (isMobile) {
      return <MobileDatagrid users={data!} onClick={handleOpenDetails} />
    }

    return (
      <DataTable<UserDTO, unknown> columns={columns} data={users} onRowClick={handleOpenDetails} />
    )
  }

  return (
    <div className="flex w-full max-w-none flex-col p-6 pb-0">
      <UserBreadcrumbs />

      <div className="flex w-full items-center justify-between p-2 pl-4">
        <span className="text-2xl font-extrabold">Users</span>
        <div className="text-muted-foreground flex gap-2 text-sm">
          <ImportButton
            onCreateBulk={() => setBulkMode('create')}
            onUpdateBulk={() => setBulkMode('update')}
          />
          <CreateButton />
        </div>
      </div>

      <div className="mb-10 h-full w-full rounded-lg">{renderTable()}</div>

      <UserDetailsDrawer
        user={selectedUser}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        isMobile={isMobile}
      />

      <BulkImportDialog
        open={!!bulkMode}
        mode={bulkMode ?? 'create'}
        onOpenChange={(open) => {
          if (!open) {
            setBulkMode(null)
          }
        }}
        onSubmit={(_file, mode) => {
          if (mode === 'create') {
            // T0 DO: parse CSV → add new users
          } else {
            // T0 D0: parse CSV → update existing users
          }
        }}
      />
    </div>
  )
}
