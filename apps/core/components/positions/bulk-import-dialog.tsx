'use client'

import { FileDown, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

type Mode = 'create' | 'update'

type Props = {
  open: boolean
  mode: Mode
  onOpenChange: (open: boolean) => void
  onSubmit?: (file: File, mode: Mode) => void
}

export function BulkImportDialog({ open, mode, onOpenChange, onSubmit }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const title = mode === 'create' ? 'Bulk Create Positions' : 'Bulk Update Positions'

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) {
      setFile(f)
    }
  }

  const formatFileSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setFile(null)
          if (inputRef.current) {
            inputRef.current.value = ''
          }
        }
        onOpenChange(v)
      }}
    >
      <DialogContent className="font-roboto flex h-[auto] max-h-[90dvh] !max-w-xl min-w-[320px] flex-col rounded-none p-0 [&>button]:text-white">
        <div className="bg-tc_primary-500 flex flex-none items-center justify-between px-6 py-4">
          <DialogTitle className="text-lg font-bold text-white">{title}</DialogTitle>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <p className="mb-3 text-base">
              <span className="font-bold">STEP 1:</span> Download the template
            </p>

            <Button
              type="button"
              variant="outline"
              className="border-tc_primary-500 text-tc_primary-500 hover:bg-tc_primary-500 h-10 w-48 text-sm font-bold hover:text-white"
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
              <p>
                <span className="font-bold">name</span> — The positions name
              </p>
              <p>
                <span className="font-bold">abbreviation</span> — The position&apos;s abbreviation
              </p>
              <p>
                <span className="font-bold">permissions</span> — The position&apos;s permission IDs
                separated by commas (view available permissions in dashboard)
              </p>
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
          </div>
        </div>

        <div className="flex w-full flex-row gap-4 px-4 pt-2 pb-4">
          <Button
            variant="outline"
            className="border-tc_primary-500 text-tc_primary-500 hover:bg-tc_primary-500 h-12 flex-1 rounded-lg text-base hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            disabled={!file}
            className="bg-tc_primary-500 hover:bg-tc_primary-500 h-12 flex-1 rounded-lg text-base text-white"
            onClick={() => {
              if (!file) {
                return
              }
              onSubmit?.(file, mode)
              onOpenChange(false)
              setFile(null)
            }}
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
