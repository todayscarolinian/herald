'use client'

import { Position, UserDTO, UserListDTO } from '@herald/types'
import { createPaginatedResult } from '@herald/utils'
import { useState } from 'react'

import { columns, CreateButton, DataTable, ImportButton, UserBreadcrumbs } from '@/components/users'
import { BulkImportDialog } from '@/components/users/bulk-import-dialog'
import { UserDetailsDrawer } from '@/components/users/user-details-drawer'
import MobileDatagrid from '@/components/users/user-mobile-datagrid'
import { useIsMobile } from '@/hooks/use-mobile'

const sample1: Position[] = [
  {
    id: 'cto',
    name: 'Chief Technology Officer',
    abbreviation: 'CTO',
    permissions: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'wr',
    name: 'Writer',
    abbreviation: 'WR',
    permissions: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
]

const sample2: Position[] = [
  {
    id: 'cto',
    name: 'Chief Technology Officer',
    abbreviation: 'WE',
    permissions: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'wr',
    name: 'Writer',
    abbreviation: 'RTO',
    permissions: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'wr',
    name: 'Writer',
    abbreviation: 'MED',
    permissions: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
]

const sample3: Position[] = [
  {
    id: 'cto',
    name: 'Chief Technology Officer',
    abbreviation: 'OME',
    permissions: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
]

const MOCK_USERS: UserDTO[] = [
  {
    id: '123',
    firstName: 'Test User',
    lastName: 'Doe',
    email: 'Doe@example.com',
    positions: sample1,
    emailVerified: true,
    disabled: false,
    createdAt: '01/02/26',
    updatedAt: '01/01/26',
  },
  {
    id: '123',
    firstName: 'Cliff',
    lastName: 'Doe',
    email: 'cliff@example.com',
    positions: sample2,
    emailVerified: true,
    disabled: false,
    createdAt: '01/02/26',
    updatedAt: '01/01/26',
  },
  {
    id: '123',
    firstName: 'Andrei',
    lastName: 'Doe',
    email: 'Andrei@example.com',
    positions: sample3,
    emailVerified: true,
    disabled: false,
    createdAt: '01/03/26',
    updatedAt: '01/01/26',
  },
  {
    id: '123',
    firstName: 'John Doe',
    lastName: 'Doe',
    email: 'John@example.com',
    positions: sample1,
    emailVerified: true,
    disabled: false,
    createdAt: '01/04/26',
    updatedAt: '01/01/26',
  },
  {
    id: '123',
    firstName: 'Jane Doe',
    lastName: 'Doe',
    email: 'Jane@example.com',
    positions: sample2,
    emailVerified: true,
    disabled: false,
    createdAt: '01/05/26',
    updatedAt: '01/01/26',
  },
  {
    id: '123',
    firstName: 'Jose Rizal',
    lastName: 'Doe',
    email: 'Jose@example.com',
    positions: sample3,
    emailVerified: true,
    disabled: false,
    createdAt: '01/06/26',
    updatedAt: '01/01/26',
  },
  {
    id: '123',
    firstName: 'Leonardo',
    lastName: 'Doe',
    email: 'Leonardo@example.com',
    positions: sample1,
    emailVerified: true,
    disabled: false,
    createdAt: '01/07/26',
    updatedAt: '01/01/26',
  },
  {
    id: '123',
    firstName: 'Kalmajun',
    lastName: 'Doe',
    email: 'Kalmajun@example.com',
    positions: sample2,
    emailVerified: true,
    disabled: false,
    createdAt: '01/08/26',
    updatedAt: '01/01/26',
  },
  {
    id: '123',
    firstName: 'Cassandra',
    lastName: 'Doe',
    email: 'Cassandra@example.com',
    positions: sample3,
    emailVerified: true,
    disabled: false,
    createdAt: '01/09/26',
    updatedAt: '01/01/26',
  },
  {
    id: '123',
    firstName: 'Maui',
    lastName: 'Doe',
    email: 'Maui@example.com',
    positions: sample1,
    emailVerified: true,
    disabled: false,
    createdAt: '01/10/26',
    updatedAt: '01/01/26',
  },
  {
    id: '123',
    firstName: 'Beatrix',
    lastName: 'Doe',
    email: 'Beatrix@example.com',
    positions: sample2,
    emailVerified: true,
    disabled: false,
    createdAt: '01/11/26',
    updatedAt: '01/01/26',
  },
  {
    id: '123',
    firstName: 'Go',
    lastName: 'Doe',
    email: 'Go@example.com',
    positions: sample3,
    emailVerified: true,
    disabled: false,
    createdAt: '01/12/26',
    updatedAt: '01/01/26',
  },
  {
    id: '123',
    firstName: 'Chris',
    lastName: 'Doe',
    email: 'Chris@example.com',
    positions: sample1,
    emailVerified: true,
    disabled: false,
    createdAt: '01/13/26',
    updatedAt: '01/01/26',
  },
  {
    id: '123',
    firstName: 'Martis',
    lastName: 'Doe',
    email: 'Martis@example.com',
    positions: sample2,
    emailVerified: true,
    disabled: false,
    createdAt: '01/14/26',
    updatedAt: '01/01/26',
  },
  {
    id: '123',
    firstName: 'Mathilda',
    lastName: 'Doe',
    email: 'Mathilda@example.com',
    positions: sample3,
    emailVerified: true,
    disabled: false,
    createdAt: '01/15/26',
    updatedAt: '01/01/26',
  },
  {
    id: '123',
    firstName: 'Marxa',
    lastName: 'Doe',
    email: 'Marxa@example.com',
    positions: sample1,
    emailVerified: true,
    disabled: false,
    createdAt: '01/16/26',
    updatedAt: '01/01/26',
  },
]

function getData(): UserListDTO {
  return createPaginatedResult(MOCK_USERS, MOCK_USERS.length, { page: 1, limit: 10 })
}

export default function UsersPage() {
  const data = getData()
  const isMobile = useIsMobile()
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState<null | 'create' | 'update'>(null)

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
        {isMobile ? (
          <MobileDatagrid users={data} onClick={handleOpenDetails} />
        ) : (
          <DataTable<UserDTO, unknown> columns={columns} data={data.items} />
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
