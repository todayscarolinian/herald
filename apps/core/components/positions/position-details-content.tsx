'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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

type Position = {
  id: string
  name: string
  abbreviation: string
  userCount: number
  createdOn: string
  permissions?: string[]
}

type Props = {
  position: Position | null
  onClose: () => void
}

export function PositionDetailsContent({ position, onClose }: Props) {
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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (position) {
      setForm({
        name: position.name,
        abbreviation: position.abbreviation,
        permissions: position.permissions ?? [], // TODO: load permissions
      })
    }
  }, [position])

  return (
    <div className="font-roboto flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-1 pb-4">
        <div className="flex flex-col gap-[10px]">
          <Label className="text-[12px] font-bold text-black">
            {' '}
            Name <span className="text-destructive">*</span>{' '}
          </Label>
          <Input
            className={`h-[36px] w-full border-[1px] bg-white text-[14px] ${
              nameError ? 'border-red-500' : 'border-tc_grayscale-500'
            }`}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          />
        </div>

        <div className="flex flex-col gap-[10px]">
          <Label className="text-[12px] font-bold text-black">
            {' '}
            Abbreviation <span className="text-destructive">*</span>{' '}
          </Label>
          <Input
            className={`h-[36px] w-full border-[1px] bg-white text-[14px] ${
              abbrError ? 'border-red-500' : 'border-tc_grayscale-500'
            }`}
            value={form.abbreviation}
            onChange={(e) => setForm((prev) => ({ ...prev, abbreviation: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, abbreviation: true }))}
          />
        </div>

        <div className="flex flex-col gap-[10px]">
          <Label className="text-[12px] font-bold text-black">
            Permissions <span className="text-destructive">*</span>
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
              className={`relative flex h-auto min-h-[36px] flex-wrap items-center gap-x-[10px] gap-y-2 rounded-md bg-white py-1 !pr-5 pl-3 ${
                permissionsError ? 'border-red-500' : 'border-tc_grayscale-500'
              } border`}
            >
              <ComboboxValue>
                {form.permissions.map((item) => (
                  <ComboboxChip
                    key={item}
                    className="bg-tc_primary-500 flex h-[24px] w-auto items-center justify-center rounded-[12px] border-none px-3 text-[12px] text-white [&_button]:hover:bg-white/20 [&_button]:focus:bg-white/20"
                  >
                    {item}
                  </ComboboxChip>
                ))}
              </ComboboxValue>

              <ComboboxChipsInput
                placeholder={form.permissions.length === 0 ? 'Select permissions...' : ''}
                className="h-[24px] min-w-[120px] flex-1 bg-transparent p-0 text-[14px] outline-none"
              />

              <div className="pointer-events-none absolute top-[9px] right-3 text-black/50">
                <ChevronDown size={16} />
              </div>
            </ComboboxChips>

            <ComboboxContent
              className="w-[--radix-popover-trigger-width] min-w-[--radix-popover-trigger-width] p-0"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <ComboboxEmpty className="text-[14px]">No permissions found.</ComboboxEmpty>
              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item} value={item} onSelect={(e) => e.stopPropagation()}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>

      <div className="bg-background mt-auto flex gap-[10px] pt-4">
        <Button
          variant="outline"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-tc_primary-500 border-tc_primary-500 hover:bg-tc_primary-500 box-border h-[40px] flex-1 rounded-[8px] border bg-white px-4 py-0 text-[14px] leading-none hover:text-white"
        >
          Delete
        </Button>

        <Button
          disabled={!isFormValid}
          className="bg-tc_primary-500 hover:bg-tc_primary-600 box-border h-[40px] flex-1 rounded-[8px] border border-transparent px-4 py-0 text-[14px] leading-none text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save
        </Button>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Position?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-tc_primary-500 hover:bg-tc_primary-600"
              onClick={() => {
                // TO DO: API call
                onClose()
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
