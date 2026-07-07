'use client'

import type { BulkPositionResult } from '@herald/types'
import { PositionDTO } from '@herald/types'
import { DEFAULT_PAGINATION } from '@herald/types'
import { FolderOpen, RefreshCw } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  BulkImportDialog,
  columns,
  CreatePositionButton,
  ImportPositionButton,
  PositionDetailsDrawer,
  PositionsTable,
} from '@/components/positions'
import { type ConfirmRow } from '@/components/positions/bulk-import-dialog'
import MobileDatagrid from '@/components/positions/mobile-datagrid'
import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/hooks/use-mobile'
import { useToastOnError } from '@/hooks/use-toast-on-error'
import {
  useBulkCreatePositions,
  useBulkUpdatePositions,
} from '@/lib/api/mutations/positionMutations'
import { usePositions } from '@/lib/api/queries/positionQueries'
import { useSession } from '@/lib/auth-client'
import { parseCreatePositionsCsv, parseUpdatePositionsCsv } from '@/lib/csv/csv-parser'

export default function PositionsPage() {
  const isMobile = useIsMobile()
  const { data: sessionData } = useSession()
  const [selectedPosition, setSelectedPosition] = useState<PositionDTO | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState<null | 'create' | 'update'>(null)
  const [bulkParseErrors, setBulkParseErrors] = useState<{ row: number; message: string }[]>([])
  const [bulkResult, setBulkResult] = useState<BulkPositionResult | null>(null)
  const [confirmRows, setConfirmRows] = useState<ConfirmRow[] | null>(null)
  const [pagination] = useState({ page: DEFAULT_PAGINATION.page, limit: DEFAULT_PAGINATION.limit })

  // Holds the strongly-typed parsed rows between the confirm step and mutation call
  const pendingRowsRef = useRef<ConfirmRow[] | null>(null)

  const { data, isLoading, isError, error, refetch } = usePositions({
    filters: {},
    pagination,
    sort: undefined,
  })

  const bulkCreateMutation = useBulkCreatePositions()
  const bulkUpdateMutation = useBulkUpdatePositions()

  const isBulkLoading = bulkCreateMutation.isPending || bulkUpdateMutation.isPending

  useToastOnError(isError, error)

  const handleOpenDetails = (position: PositionDTO) => {
    setSelectedPosition(position)
    setIsDrawerOpen(true)
  }

  const resetBulkState = () => {
    setBulkParseErrors([])
    setBulkResult(null)
    setConfirmRows(null)
    pendingRowsRef.current = null
    bulkCreateMutation.reset()
    bulkUpdateMutation.reset()
  }

  const handleBulkDialogClose = (open: boolean) => {
    if (!open) {
      setBulkMode(null)
      resetBulkState()
    }
  }

  // Step 1: parse CSV and show the confirmation step
  const handleBulkSubmit = async (file: File, mode: 'create' | 'update') => {
    if (!sessionData?.user?.id) {
      toast.error('Session expired. Please sign in again.')
      return
    }

    setBulkParseErrors([])
    setBulkResult(null)
    setConfirmRows(null)

    const parsed =
      mode === 'create' ? await parseCreatePositionsCsv(file) : await parseUpdatePositionsCsv(file)

    if (parsed.errors.length > 0) {
      setBulkParseErrors(parsed.errors)
      return
    }

    if (parsed.rows.length === 0) {
      setBulkParseErrors([{ row: 0, message: 'No valid rows found in the CSV.' }])
      return
    }

    pendingRowsRef.current = parsed.rows
    setConfirmRows(parsed.rows)
  }

  // Step 2: after the admin confirms, run the mutation
  const handleConfirm = () => {
    if (!sessionData?.user?.id || !pendingRowsRef.current || !bulkMode) {
      return
    }

    const rows = pendingRowsRef.current

    const onSuccess = (response: { data?: BulkPositionResult | null }) => {
      const result = response.data ?? { succeeded: [], failed: [] }
      setBulkResult(result)
      setConfirmRows(null)

      if (result.failed.length === 0) {
        toast.success(
          `${result.succeeded.length} position(s) ${bulkMode === 'create' ? 'created' : 'updated'} successfully.`
        )
      } else {
        toast.warning(
          `${result.succeeded.length} succeeded, ${result.failed.length} failed. See the dialog for details.`
        )
      }
    }

    const onError = (err: Error) => {
      toast.error(err.message)
    }

    if (bulkMode === 'create') {
      bulkCreateMutation.mutate({ positions: rows }, { onSuccess, onError })
    } else {
      bulkUpdateMutation.mutate({ positions: rows }, { onSuccess, onError })
    }
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
    <main className="flex w-full max-w-none flex-col">
      <PageHeader title="Positions" />

      <div className="flex flex-col p-6 pb-0">
        <div className="flex w-full items-center justify-end p-2 pl-4">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <ImportPositionButton
              onCreateBulk={() => setBulkMode('create')}
              onUpdateBulk={() => setBulkMode('update')}
            />
            <CreatePositionButton />
          </div>
        </div>

        <div className="mb-10 h-full w-full rounded-lg">{renderTable()}</div>
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
        onOpenChange={handleBulkDialogClose}
        onSubmit={(file, mode) => void handleBulkSubmit(file, mode)}
        onConfirm={handleConfirm}
        onBack={() => setConfirmRows(null)}
        isLoading={isBulkLoading}
        result={bulkResult}
        parseErrors={bulkParseErrors}
        confirmRows={confirmRows}
      />
    </main>
  )
}
