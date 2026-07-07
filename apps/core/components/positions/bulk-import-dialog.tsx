'use client'

import type { BulkPositionOperationFailure, BulkPositionResult, Domain } from '@herald/types'

import {
  BulkImportDialog as SharedBulkImportDialog,
  type Mode,
} from '@/components/shared/bulk-import-dialog'
import { downloadPositionsCsvTemplate } from '@/lib/csv/csv-parser'

export type ConfirmRow = {
  name: string
  abbreviation: string
  domains: Domain[]
}

type Props = {
  open: boolean
  mode: Mode
  onOpenChange: (open: boolean) => void
  onSubmit?: (file: File, mode: Mode) => void
  onConfirm?: () => void
  onBack?: () => void
  isLoading?: boolean
  result?: BulkPositionResult | null
  parseErrors?: { row: number; message: string }[]
  confirmRows?: ConfirmRow[] | null
}

const FIELDS = [
  { name: 'name', description: "Required. The position's name." },
  { name: 'abbreviation', description: "Required. The position's abbreviation." },
  {
    name: 'domains',
    description: 'Optional. Domains separated by | (e.g. TC Herald|TC Official Website).',
  },
]

export function BulkImportDialog(props: Props) {
  return (
    <SharedBulkImportDialog<ConfirmRow, BulkPositionOperationFailure>
      {...props}
      entityLabel="position"
      fields={{ create: FIELDS, update: FIELDS }}
      onDownloadTemplate={downloadPositionsCsvTemplate}
      renderConfirmRow={(row) => (
        <>
          <p className="text-sm font-medium text-black">
            {row.name} ({row.abbreviation})
          </p>
          {row.domains.length > 0 && (
            <p className="mt-0.5 text-xs text-gray-400">{row.domains.join(', ')}</p>
          )}
        </>
      )}
      renderFailureRow={(failure) => (
        <>
          Row {failure.row} ({failure.name}): {failure.error}
        </>
      )}
    />
  )
}
