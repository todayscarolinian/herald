'use client'

import type { BulkOperationFailure, BulkUserResult } from '@herald/types'

import {
  BulkImportDialog as SharedBulkImportDialog,
  type Mode,
} from '@/components/shared/bulk-import-dialog'
import { downloadCsvTemplate } from '@/lib/utils/csv-parser'

export type ConfirmRow = {
  email: string
  firstName: string
  middleName?: string
  lastName: string
  positionNames: string[]
}

type Props = {
  open: boolean
  mode: Mode
  onOpenChange: (open: boolean) => void
  onSubmit?: (file: File, mode: Mode) => void
  onConfirm?: () => void
  onBack?: () => void
  isLoading?: boolean
  result?: BulkUserResult | null
  parseErrors?: { row: number; message: string }[]
  confirmRows?: ConfirmRow[] | null
}

const CREATE_FIELDS = [
  { name: 'firstName', description: "Required. The user's first name." },
  { name: 'middleName', description: "Optional. The user's middle name." },
  { name: 'lastName', description: "Required. The user's last name." },
  { name: 'email', description: "Required. The user's email address." },
  {
    name: 'positions',
    description: 'Required. Position names separated by | (e.g. Editor|Reporter).',
  },
]

const UPDATE_FIELDS = [
  { name: 'email', description: 'Required. Identifies which user to update.' },
  { name: 'firstName', description: "Required. The user's first name." },
  { name: 'middleName', description: "Optional. The user's middle name." },
  { name: 'lastName', description: "Required. The user's last name." },
  {
    name: 'positions',
    description: 'Required. Position names separated by | (e.g. Editor|Reporter).',
  },
]

export function BulkImportDialog(props: Props) {
  return (
    <SharedBulkImportDialog<ConfirmRow, BulkOperationFailure>
      {...props}
      entityLabel="user"
      fields={{ create: CREATE_FIELDS, update: UPDATE_FIELDS }}
      onDownloadTemplate={downloadCsvTemplate}
      renderConfirmRow={(row) => (
        <>
          <p className="text-sm font-medium text-black">
            {row.firstName} {row.middleName ? `${row.middleName} ` : ''}
            {row.lastName}
          </p>
          <p className="text-xs text-gray-500">{row.email}</p>
          {row.positionNames.length > 0 && (
            <p className="mt-0.5 text-xs text-gray-400">{row.positionNames.join(', ')}</p>
          )}
        </>
      )}
      renderFailureRow={(failure) => (
        <>
          Row {failure.row} ({failure.email}): {failure.error}
        </>
      )}
    />
  )
}
