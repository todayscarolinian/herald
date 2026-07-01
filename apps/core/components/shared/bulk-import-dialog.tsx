'use client'

import { CheckCircle, FileDown, Trash2, Upload, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

export type Mode = 'create' | 'update'

export type BulkFieldDescription = {
  name: string
  description: string
}

type BulkResultLike<TFailure> = {
  succeeded: unknown[]
  failed: TFailure[]
}

function pluralize(label: string, count: number): string {
  return count === 1 ? label : `${label}s`
}

function capitalize(label: string): string {
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`
}

type Props<TRow, TFailure extends { row: number; error: string }> = {
  open: boolean
  mode: Mode
  /** Singular, lowercase entity name, e.g. "user" or "position". */
  entityLabel: string
  onOpenChange: (open: boolean) => void
  onSubmit?: (file: File, mode: Mode) => void
  onConfirm?: () => void
  onBack?: () => void
  isLoading?: boolean
  result?: BulkResultLike<TFailure> | null
  parseErrors?: { row: number; message: string }[]
  confirmRows?: TRow[] | null
  fields: { create: BulkFieldDescription[]; update: BulkFieldDescription[] }
  onDownloadTemplate: (mode: Mode) => void
  renderConfirmRow: (row: TRow, index: number) => ReactNode
  renderFailureRow: (failure: TFailure) => ReactNode
}

export function BulkImportDialog<TRow, TFailure extends { row: number; error: string }>({
  open,
  mode,
  entityLabel,
  onOpenChange,
  onSubmit,
  onConfirm,
  onBack,
  isLoading = false,
  result = null,
  parseErrors = [],
  confirmRows = null,
  fields,
  onDownloadTemplate,
  renderConfirmRow,
  renderFailureRow,
}: Props<TRow, TFailure>) {
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const entityPluralCapitalized = `${capitalize(entityLabel)}s`
  const title =
    mode === 'create'
      ? `Bulk Create ${entityPluralCapitalized}`
      : `Bulk Update ${entityPluralCapitalized}`
  const modeFields = mode === 'create' ? fields.create : fields.update

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setFile(null)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
    onOpenChange(isOpen)
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
      return (
        <ResultSummary
          result={result}
          entityLabel={entityLabel}
          renderFailureRow={renderFailureRow}
        />
      )
    }

    if (isConfirming) {
      return (
        <ConfirmationStep
          mode={mode}
          rows={confirmRows}
          entityLabel={entityLabel}
          renderConfirmRow={renderConfirmRow}
        />
      )
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
            onClick={() => onDownloadTemplate(mode)}
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
            {modeFields.map((field) => (
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
      const countLabel = `${confirmRows.length} ${pluralize(entityLabel, confirmRows.length)}`
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
                ? `Create ${countLabel}`
                : `Update ${countLabel}`}
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

function ConfirmationStep<TRow>({
  mode,
  rows,
  entityLabel,
  renderConfirmRow,
}: {
  mode: Mode
  rows: TRow[]
  entityLabel: string
  renderConfirmRow: (row: TRow, index: number) => ReactNode
}) {
  const verb = mode === 'create' ? 'create' : 'update'
  const count = rows.length

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        You are about to <span className="font-bold">{verb.toUpperCase()}</span>{' '}
        <span className="font-bold">{count}</span> {pluralize(entityLabel, count)}. Review the rows
        below before confirming.
      </p>

      <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
        {rows.map((row, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index} className="px-4 py-3">
            {renderConfirmRow(row, index)}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ResultSummary<TFailure extends { row: number; error: string }>({
  result,
  entityLabel,
  renderFailureRow,
}: {
  result: BulkResultLike<TFailure>
  entityLabel: string
  renderFailureRow: (failure: TFailure) => ReactNode
}) {
  const succeededCount = result.succeeded.length
  const failedCount = result.failed.length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="text-sm font-medium text-green-700">
          {succeededCount} {pluralize(entityLabel, succeededCount)} processed successfully
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
            {result.failed.map((failure) => (
              <li key={failure.row} className="text-xs text-red-600">
                {renderFailureRow(failure)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
