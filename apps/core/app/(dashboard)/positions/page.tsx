'use client'

import { PositionDTO } from '@herald/types'
import { DEFAULT_PAGINATION } from '@herald/types'
import { FolderOpen, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

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
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/hooks/use-mobile'
import { usePositions } from '@/lib/api/queries/positionQueries'

export default function PositionsPage() {
  const isMobile = useIsMobile()
  const [selectedPosition, setSelectedPosition] = useState<PositionDTO | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState<null | 'create' | 'update'>(null)
  const [pagination] = useState({ page: DEFAULT_PAGINATION.page, limit: DEFAULT_PAGINATION.limit })

  const { data, isLoading, isError, error, refetch } = usePositions({
    filters: {},
    pagination,
    sort: undefined,
  })

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message)
    }
  }, [isError, error])

  const handleOpenDetails = (position: PositionDTO) => {
    setSelectedPosition(position)
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
          <p className="text-muted-foreground text-sm">Failed to load positions.</p>
          <Button variant="outline" onClick={() => void refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )
    }

    const items = data?.items ?? []

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <FolderOpen className="text-muted-foreground h-10 w-10" />
          <p className="text-lg font-semibold">No positions yet</p>
          <p className="text-muted-foreground text-sm">Create the first position to get started.</p>
        </div>
      )
    }

    if (isMobile) {
      return <MobileDatagrid positions={data!} onClick={handleOpenDetails} />
    }

    return (
      <PositionsTable<PositionDTO, unknown>
        data={items}
        columns={columns}
        onRowClick={handleOpenDetails}
      />
    )
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

      <div className="mb-10 h-full w-full rounded-lg">{renderTable()}</div>

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
            // TODO: parse CSV → add new positions
          } else {
            // TODO: parse CSV → update existing positions
          }
        }}
      />
    </main>
  )
}
