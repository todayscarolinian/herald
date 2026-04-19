'use client'

import { UserDTO } from '@herald/types'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

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

type Props = {
  user: UserDTO | null
  onClose: () => void
}

export function UserDetailsContent({ user, onClose }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [form, setForm] = useState(() => ({
    firstName: user?.firstName ?? '',
    middleName: user?.middleName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    positions: user?.positions.map((p) => p.id) ?? [],
  }))

  const [touched, setTouched] = useState({
    firstName: false,
    middleName: false,
    lastName: false,
    email: false,
    positions: false,
  })

  const firstNameError = touched.firstName && form.firstName.trim() === ''
  const middleNameError = touched.middleName && form.middleName.trim() === ''
  const lastNameError = touched.lastName && form.lastName.trim() === ''
  const emailError = touched.email && form.email.trim() === ''
  const positionsError = touched.positions && form.positions.length === 0

  const isFormValid =
    form.firstName.trim() !== '' &&
    form.lastName.trim() !== '' &&
    form.email.trim() !== '' &&
    form.positions.length > 0

  if (!user) {
    return null
  }

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
              firstNameError ? 'border-red-500' : 'border-tc_grayscale-500'
            }`}
            value={form.firstName}
            onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
          />
        </div>

        <div className="flex flex-col gap-[10px]">
          <Label className="text-[12px] font-bold text-black">
            {' '}
            Middle Name <span className="text-destructive">*</span>{' '}
          </Label>
          <Input
            className={`h-[36px] w-full border-[1px] bg-white text-[14px] ${
              middleNameError ? 'border-red-500' : 'border-tc_grayscale-500'
            }`}
            value={form.middleName}
            onChange={(e) => setForm((prev) => ({ ...prev, middleName: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, middleName: true }))}
          />
        </div>

        <div className="flex flex-col gap-[10px]">
          <Label className="text-[12px] font-bold text-black">
            {' '}
            Last Name <span className="text-destructive">*</span>{' '}
          </Label>
          <Input
            className={`h-[36px] w-full border-[1px] bg-white text-[14px] ${
              lastNameError ? 'border-red-500' : 'border-tc_grayscale-500'
            }`}
            value={form.lastName}
            onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
          />
        </div>

        <div className="flex flex-col gap-[10px]">
          <Label className="text-[12px] font-bold text-black">
            {' '}
            Email <span className="text-destructive">*</span>{' '}
          </Label>
          <Input
            className={`h-[36px] w-full border-[1px] bg-white text-[14px] ${
              emailError ? 'border-red-500' : 'border-tc_grayscale-500'
            }`}
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          />
        </div>

        <div className="flex flex-col gap-[10px]">
          <Label className="text-[12px] font-bold text-black">
            Positions <span className="text-destructive">*</span>
          </Label>

          <Combobox
            items={PERMISSIONS}
            multiple
            value={form.positions}
            onValueChange={(value) => {
              setTouched((t) => ({ ...t, positions: true }))
              setForm((prev) => ({ ...prev, positions: value }))
            }}
          >
            <ComboboxChips
              className={`relative flex h-auto min-h-[36px] flex-wrap items-center gap-x-[10px] gap-y-2 rounded-md bg-white py-1 !pr-5 pl-3 ${
                positionsError ? 'border-red-500' : 'border-tc_grayscale-500'
              } border`}
            >
              <ComboboxValue>
                {form.positions.map((item) => (
                  <ComboboxChip
                    key={item}
                    className="bg-tc_primary-500 flex h-[24px] w-auto items-center justify-center rounded-[12px] border-none px-3 text-[12px] text-white [&_button]:hover:bg-white/20 [&_button]:focus:bg-white/20"
                  >
                    {item}
                  </ComboboxChip>
                ))}
              </ComboboxValue>

              <ComboboxChipsInput
                placeholder={form.positions.length === 0 ? 'Select positions...' : ''}
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
              <ComboboxEmpty className="text-[14px]">No positions found.</ComboboxEmpty>
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
