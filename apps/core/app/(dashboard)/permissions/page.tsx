'use client'

import { PermissionDTO, PermissionListDTO } from '@herald/types'
import { createPaginatedResult } from '@herald/utils'
import { useState } from 'react'

import {
  columns,
  PermissionBreadcrumbs,
  PermissionDataTable,
  PermissionDetailsDrawer,
  PermissionMobileDatagrid,
} from '@/components/permissions'
import { useIsMobile } from '@/hooks/use-mobile'

const MOCK_PERMISSIONS: PermissionDTO[] = [
  {
    id: 'perm-1',
    name: 'CREATE_ARTICLE',
    domain: 'TC Official Website',
    description: 'Create a new article draft.',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
  },
  {
    id: 'perm-2',
    name: 'EDIT_ARTICLE',
    domain: 'TC Official Website',
    description: 'Edit existing article content before publication.',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
  },
  {
    id: 'perm-3',
    name: 'PUBLISH_ARTICLE',
    domain: 'TC Official Website',
    description: 'Publish approved articles to the public site.',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
  },
  {
    id: 'perm-4',
    name: 'ARCHIVE_ARTICLE',
    domain: 'TC Official Website',
    description: 'Archive outdated or retired articles.',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
  },
  {
    id: 'perm-5',
    name: 'CREATE_USER',
    domain: 'TC Herald',
    description: 'Create user accounts in the system.',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
  },
  {
    id: 'perm-6',
    name: 'UPDATE_USER',
    domain: 'TC Herald',
    description: 'Update profile and role details for existing users.',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
  },
  {
    id: 'perm-7',
    name: 'DELETE_USER',
    domain: 'TC Herald',
    description: 'Remove users and revoke their active access.',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
  },
  {
    id: 'perm-8',
    name: 'CREATE_POSITION',
    domain: 'TC Herald',
    description: 'Create positions and assign permission sets.',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
  },
  {
    id: 'perm-9',
    name: 'UPDATE_POSITION',
    domain: 'TC Herald',
    description: 'Modify position details and linked permissions.',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
  },
  {
    id: 'perm-10',
    name: 'DELETE_POSITION',
    domain: 'TC Herald',
    description: 'Delete positions that are no longer in use.',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
  },
  {
    id: 'perm-11',
    name: 'VIEW_AUDIT_LOGS',
    domain: 'TC Herald',
    description: 'View all audit records across protected resources.',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
  },
  {
    id: 'perm-12',
    name: 'EXPORT_AUDIT_LOGS',
    domain: 'TC Herald',
    description: 'Export audit log data for reporting and compliance.',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
  },
  {
    id: 'perm-13',
    name: 'MANAGE_SPORTS',
    domain: 'USC Days',
    description: 'Create and manage USC days activities and sports for the calendar.',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
  },
]

const MOCK_PERMISSIONS_LIST: PermissionListDTO = createPaginatedResult(
  MOCK_PERMISSIONS,
  MOCK_PERMISSIONS.length,
  { page: 1, limit: 10 }
)

export default function PermissionsPage() {
  const [permissions] = useState(MOCK_PERMISSIONS_LIST)
  const isMobile = useIsMobile()
  const [selectedPermission, setSelectedPermission] = useState<PermissionDTO | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleOpenDetails = (permission: PermissionDTO) => {
    setSelectedPermission(permission)
    setIsDrawerOpen(true)
  }

  return (
    <main className="flex w-full max-w-none flex-col p-6 pb-0">
      <PermissionBreadcrumbs />

      <div className="flex w-full items-center justify-between p-2 pl-4">
        <span className="text-2xl font-extrabold">Permissions</span>
      </div>

      <div className="mt-8 mb-10 h-full w-full rounded-lg">
        {isMobile ? (
          <PermissionMobileDatagrid permissions={permissions} onClick={handleOpenDetails} />
        ) : (
          <PermissionDataTable
            columns={columns}
            data={permissions.items}
            onRowClick={handleOpenDetails}
          />
        )}
      </div>

      <PermissionDetailsDrawer
        permission={selectedPermission}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        isMobile={isMobile}
      />
    </main>
  )
}
