'use client'

import { UserDTO } from '@herald/types'
import { useState } from 'react'

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

  const { data, isLoading } = useUsers({
    filters: {},
    pagination: { page: 1, limit: 200 },
  })

  const users = data?.items ?? []

  const handleOpenDetails = (user: UserDTO) => {
    setSelectedUser(user)
    setIsDrawerOpen(true)
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

      <div className="mb-10 h-full w-full rounded-lg">
        {isLoading ? (
          <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
            Loading users...
          </div>
        ) : isMobile ? (
          <MobileDatagrid users={{ ...data!, items: users }} onClick={handleOpenDetails} />
        ) : (
          <DataTable<UserDTO, unknown>
            columns={columns}
            data={users}
            onRowClick={handleOpenDetails}
          />
        )}
      </div>

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
