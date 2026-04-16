'use client'

import { ChevronDown, Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@/components/ui/combobox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PERMISSIONS = [
  'CREATE_ARTICLE',
  'MANAGE_USC_DAYS',
  'EDIT_ARTICLE',
  'DELETE_ARTICLE',
  'MANAGE_USERS',
  'VIEW_AUDIT_LOGS',
  'MANAGE_PERMISSIONS',
  'PUBLISH_ARTICLE',
  'MANAGE_POSITIONS',
]

export function CreatePositionButton() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    abbreviation: '',
    permissions: [] as string[],
  })

  const [touched, setTouched] = useState({
    name: false,
    abbreviation: false,
    permissions: false,
  })

  const nameError = touched.name && form.name.trim() === ''
  const abbrError = touched.abbreviation && form.abbreviation.trim() === ''
  const permissionsError = touched.permissions && form.permissions.length === 0
  const isFormValid =
    form.name.trim() !== '' && form.abbreviation.trim() !== '' && form.permissions.length > 0

  const handleReset = () => {
    setForm({ name: '', abbreviation: '', permissions: [] })
    setTouched({ name: false, abbreviation: false, permissions: false })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) {
      return
    }

    // TO DO: API Call here
    setOpen(false)
    handleReset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          handleReset()
        }
      }}
    >
      <DialogTrigger className="font-roboto p-2">
        <div className="text-tc_primary-500 hover:text-tc_primary-300 flex h-auto flex-col items-center gap-1 p-2">
          <Plus className="h-5 w-5" />
          <span className="text-sm font-medium">Create</span>
        </div>
      </DialogTrigger>

      <DialogContent className="font-roboto min-w-[300px] p-9 sm:max-w-2xl [&>button]:top-9 [&>button]:right-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold uppercase">Create Position</DialogTitle>
            <DialogDescription className="text-base">
              Creates a new organizational position. Click Create Position when you're done.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pos-name" className="text-base font-bold">
                Position Name <span className="text-tc_primary-500">*</span>
              </Label>
              <Input
                id="pos-name"
                placeholder="e.g. Editor-in-Chief"
                className={nameError ? 'border-red-500' : 'border-tc_grayscale-500'}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="pos-abbr" className="text-base font-bold">
                Abbreviation <span className="text-tc_primary-500">*</span>
              </Label>
              <Input
                id="pos-abbr"
                placeholder="e.g. EIC"
                className={abbrError ? 'border-red-500' : 'border-tc_grayscale-500'}
                value={form.abbreviation}
                onChange={(e) => setForm((p) => ({ ...p, abbreviation: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, abbreviation: true }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-base font-bold">
                Permissions <span className="text-tc_primary-500">*</span>
              </Label>
              <Combobox
                items={PERMISSIONS}
                multiple
                value={form.permissions}
                onValueChange={(value) => {
                  setTouched((t) => ({ ...t, permissions: true }))
                  setForm((prev) => ({ ...prev, permissions: value }))
                }}
              >
                <ComboboxChips
                  className={`relative flex h-auto min-h-[36px] flex-wrap items-center gap-x-2 gap-y-2 rounded-md border bg-white py-1 !pr-10 pl-3 ${
                    permissionsError ? 'border-red-500' : 'border-tc_grayscale-500'
                  }`}
                >
                  <ComboboxValue>
                    {form.permissions.map((item) => (
                      <ComboboxChip
                        key={item}
                        className="bg-tc_primary-500 flex h-6 items-center rounded-full border-none px-3 text-[12px] text-white"
                      >
                        {item}
                      </ComboboxChip>
                    ))}
                  </ComboboxValue>
                  <ComboboxChipsInput
                    placeholder={form.permissions.length === 0 ? 'Select permissions...' : ''}
                    className="h-6 flex-1 bg-transparent text-base outline-none"
                  />
                  <div className="pointer-events-none absolute top-2.5 right-3 text-black/50">
                    <ChevronDown size={16} />
                  </div>
                </ComboboxChips>

                <ComboboxContent className="w-[--radix-popover-trigger-width]">
                  <ComboboxEmpty>No permissions found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>

          <DialogFooter className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <DialogClose className="border-tc_primary-600 text-tc_primary-600 hover:bg-tc_primary-600 flex h-12 w-full items-center justify-center rounded-sm border text-base font-bold transition-none hover:text-white sm:w-[97px]">
              Cancel
            </DialogClose>

            <Button
              type="submit"
              disabled={!isFormValid}
              className="bg-tc_primary-600 hover:bg-tc_primary-700 h-12 w-full rounded-sm text-base font-bold text-white transition-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-[157px]"
            >
              Create Position
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
