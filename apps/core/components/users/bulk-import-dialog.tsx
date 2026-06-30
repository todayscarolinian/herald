'use client'

import type { BulkOperationFailure, BulkUserResult } from '@herald/types'
import { CheckCircle, FileDown, Trash2, Upload, XCircle } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { downloadCsvTemplate } from '@/lib/utils/csv-parser'

type Mode = 'create' | 'update'

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

export function BulkImportDialog({
  open,
  mode,
  onOpenChange,
  onSubmit,
  onConfirm,
  onBack,
  isLoading = false,
  result = null,
  parseErrors = [],
  confirmRows = null,
}: Props) {
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const title = mode === 'create' ? 'Bulk Create Users' : 'Bulk Update Users'
  const fields = mode === 'create' ? CREATE_FIELDS : UPDATE_FIELDS

  const handleClose = (open: boolean) => {
    if (!open) {
      setFile(null)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
    onOpenChange(open)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) {
      setFile(f)
    }
  }

  const formatFileSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`

  const hasResult = result !== null
  const isConfirming = confirmRows !== null && !hasResult
  const hasErrors = parseErrors.length > 0

  const renderBody = () => {
    if (hasResult) {
      return <ResultSummary result={result} />
    }

    if (isConfirming) {
      return <ConfirmationStep mode={mode} rows={confirmRows} />
    }

    return (
      <>
        <div className="space-y-2">
          <p className="mb-3 text-base">
            <span className="font-bold">STEP 1:</span> Download the template
          </p>

          <Button
            type="button"
            variant="outline"
            className="border-tc_primary-500 text-tc_primary-500 hover:bg-tc_primary-500 h-10 w-48 text-sm font-bold hover:text-white"
            onClick={() => downloadCsvTemplate(mode)}
          >
            <FileDown className="mr-1 h-5 w-5" />
            Download template
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-base">
            <span className="font-bold">STEP 2:</span> Fill in required columns
          </p>

          <div className="space-y-1 text-sm text-black">
            {fields.map((field) => (
              <p key={field.name}>
                <span className="font-bold">{field.name}</span> — {field.description}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="mb-3 text-base">
            <span className="font-bold">STEP 3:</span> Upload the completed file here
          </p>

          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-tc_primary-500 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center hover:bg-red-50"
          >
            <Upload className="text-tc_primary-500 mx-auto mb-2 h-6 w-6" />
            <p className="text-tc_primary-500 mt-1 text-base font-bold">Upload File</p>
            <p className="text-tc_primary-500/60 mt-2 text-sm">
              Support for CSV files up to 10MB each
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {file && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-300 p-3">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-100 text-[11px] font-bold text-gray-500">
                  CSV
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-black">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="rounded-full p-2 transition-colors hover:bg-gray-100"
              >
                <Trash2 className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          )}

          {hasErrors && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="mb-2 text-sm font-bold text-red-700">CSV validation errors:</p>
              <ul className="space-y-1">
                {parseErrors.map((e) => (
                  <li key={`${e.row}-${e.message}`} className="text-xs text-red-600">
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </>
    )
  }

  const renderFooter = () => {
    if (hasResult) {
      return (
        <Button
          variant="outline"
          className="border-tc_primary-500 text-tc_primary-500 hover:bg-tc_primary-500 h-12 flex-1 rounded-lg text-base hover:text-white"
          onClick={() => onOpenChange(false)}
        >
          Close
        </Button>
      )
    }

    if (isConfirming) {
      return (
        <>
          <Button
            variant="outline"
            className="border-tc_primary-500 text-tc_primary-500 hover:bg-tc_primary-500 h-12 flex-1 rounded-lg text-base hover:text-white"
            onClick={onBack}
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            disabled={isLoading}
            className="bg-tc_primary-500 hover:bg-tc_primary-500 h-12 flex-1 rounded-lg text-base text-white"
            onClick={onConfirm}
          >
            {isLoading
              ? 'Processing…'
              : mode === 'create'
                ? `Create ${confirmRows.length} user${confirmRows.length !== 1 ? 's' : ''}`
                : `Update ${confirmRows.length} user${confirmRows.length !== 1 ? 's' : ''}`}
          </Button>
        </>
      )
    }

    return (
      <>
        <Button
          variant="outline"
          className="border-tc_primary-500 text-tc_primary-500 hover:bg-tc_primary-500 h-12 flex-1 rounded-lg text-base hover:text-white"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          disabled={!file || isLoading || hasErrors}
          className="bg-tc_primary-500 hover:bg-tc_primary-500 h-12 flex-1 rounded-lg text-base text-white"
          onClick={() => {
            if (!file) {
              return
            }
            onSubmit?.(file, mode)
          }}
        >
          {isLoading ? 'Processing…' : 'Submit'}
        </Button>
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="font-roboto flex h-auto max-h-[90dvh] max-w-xl! min-w-[320px] flex-col rounded-none p-0 [&>button]:text-white">
        <div className="bg-tc_primary-500 flex flex-none items-center justify-between px-6 py-4">
          <DialogTitle className="text-lg font-bold text-white">{title}</DialogTitle>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">{renderBody()}</div>

        <div className="flex w-full flex-row gap-4 px-4 pt-2 pb-4">{renderFooter()}</div>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmationStep({ mode, rows }: { mode: Mode; rows: ConfirmRow[] }) {
  const verb = mode === 'create' ? 'create' : 'update'
  const count = rows.length

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        You are about to <span className="font-bold">{verb.toUpperCase()}</span>{' '}
        <span className="font-bold">{count}</span> user{count !== 1 ? 's' : ''}. Review the rows
        below before confirming.
      </p>

      <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
        {rows.map((row, index) => (
          <li key={`${row.email}-${index}`} className="px-4 py-3">
            <p className="text-sm font-medium text-black">
              {row.firstName} {row.middleName ? `${row.middleName} ` : ''}
              {row.lastName}
            </p>
            <p className="text-xs text-gray-500">{row.email}</p>
            {row.positionNames.length > 0 && (
              <p className="mt-0.5 text-xs text-gray-400">{row.positionNames.join(', ')}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ResultSummary({ result }: { result: BulkUserResult }) {
  const succeededCount = result.succeeded.length
  const failedCount = result.failed.length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="text-sm font-medium text-green-700">
          {succeededCount} user{succeededCount !== 1 ? 's' : ''} processed successfully
        </span>
      </div>

      {failedCount > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-700">
              {failedCount} row{failedCount !== 1 ? 's' : ''} failed
            </span>
          </div>
          <ul className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3">
            {result.failed.map((failure: BulkOperationFailure) => (
              <li key={`${failure.row}-${failure.email}`} className="text-xs text-red-600">
                Row {failure.row} ({failure.email}): {failure.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
