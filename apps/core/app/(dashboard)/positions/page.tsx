'use client'

import { PositionDTO, PositionListDTO } from '@herald/types'
import { createPaginatedResult } from '@herald/utils'
import { useState } from 'react'

import {
  BulkImportDialog,
  columns,
  CreatePositionButton,
  ImportPositionButton,
  PositionBreadcrumbs,
  PositionDetailsDrawer,
  PositionsTable,
} from '@/components/positions'
import MobileDatagrid from '@/components/positions/mobile-datagrid'
import { useIsMobile } from '@/hooks/use-mobile'

const MOCK_POSITIONS: PositionDTO[] = [
  {
    id: '1',
    name: 'Editor-in-Chief',
    abbreviation: 'EIC',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
    userCount: 5,
    permissions: ['CREATE_ARTICLE', 'PUBLISH_ARTICLE', 'MANAGE_USERS'],
  },
  {
    id: '2',
    name: 'Managing Editor for Development',
    abbreviation: 'MED',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
    userCount: 3,
    permissions: ['EDIT_ARTICLE'],
  },
  {
    id: '3',
    name: 'Managing Editor for Administration',
    abbreviation: 'MEA',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
    userCount: 2,
    permissions: [],
  },
  {
    id: '4',
    name: 'Writer',
    abbreviation: 'WR',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
    userCount: 2,
    permissions: [],
  },
  {
    id: '5',
    name: 'Researcher',
    abbreviation: 'RES',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
    userCount: 1,
    permissions: [],
  },
  {
    id: '6',
    name: 'Web Developer',
    abbreviation: 'WEB',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
    userCount: 1,
    permissions: [],
  },
  {
    id: '7',
    name: 'Visual Designer',
    abbreviation: 'VD',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
    userCount: 1,
    permissions: [],
  },
  {
    id: '8',
    name: 'Associate Editor-in-Chief',
    abbreviation: 'AEIC',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
    userCount: 1,
    permissions: ['CREATE_ARTICLE', 'PUBLISH_ARTICLE'],
  },
  {
    id: '9',
    name: 'Copy Editor',
    abbreviation: 'CE',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
    userCount: 1,
    permissions: ['CREATE_ARTICLE', 'PUBLISH_ARTICLE'],
  },
  {
    id: '10',
    name: 'Social Media Manager',
    abbreviation: 'SMM',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
    userCount: 1,
    permissions: ['CREATE_ARTICLE', 'PUBLISH_ARTICLE'],
  },
  {
    id: '11',
    name: 'Photographer',
    abbreviation: 'PHO',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
    userCount: 1,
    permissions: ['CREATE_ARTICLE', 'PUBLISH_ARTICLE'],
  },
  {
    id: '12',
    name: 'Videographer',
    abbreviation: 'VID',
    createdAt: '01/01/26',
    updatedAt: '01/01/26',
    userCount: 1,
    permissions: ['CREATE_ARTICLE', 'PUBLISH_ARTICLE'],
  },
]

const MOCK_POSITIONS_LIST: PositionListDTO = createPaginatedResult(
  MOCK_POSITIONS,
  MOCK_POSITIONS.length,
  { page: 1, limit: 10 }
)

export default function PositionsPage() {
  const [positions] = useState(MOCK_POSITIONS_LIST)
  const isMobile = useIsMobile()
  const [selectedPosition, setSelectedPosition] = useState<PositionDTO | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState<null | 'create' | 'update'>(null)

  const handleOpenDetails = (position: PositionDTO) => {
    setSelectedPosition(position)
    setIsDrawerOpen(true)
  }

  return (
    <main className="flex w-full max-w-none flex-col p-6 pb-0">
      <PositionBreadcrumbs />

      <div className="flex w-full items-center justify-between p-2 pl-4">
        <span className="text-2xl font-extrabold">Positions</span>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <ImportPositionButton
            onCreateBulk={() => setBulkMode('create')}
            onUpdateBulk={() => setBulkMode('update')}
          />
          <CreatePositionButton />
        </div>
      </div>

      <div className="mb-10 h-full w-full rounded-lg">
        {isMobile ? (
          <MobileDatagrid positions={positions} onClick={handleOpenDetails} />
        ) : (
          <div className="h-full w-full rounded-lg">
            <PositionsTable<PositionDTO, unknown>
              data={positions.items}
              columns={columns}
              onRowClick={handleOpenDetails}
            />
          </div>
        )}
      </div>

      <PositionDetailsDrawer
        position={selectedPosition}
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
            // T0 DO: parse CSV → add new positions
          } else {
            // T0 D0: parse CSV → update existing positions
          }
        }}
      />
    </main>
  )
}
