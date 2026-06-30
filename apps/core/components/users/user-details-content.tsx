'use client'

import { Position, UserDTO } from '@herald/types'
import { useState } from 'react'
import { toast } from 'sonner'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDeleteUser, useDisableUser, useUpdateUser } from '@/lib/api/mutations/userMutations'
import { usePositions } from '@/lib/api/queries/positionQueries'
import { useSession } from '@/lib/auth-client'

import { PositionsCombobox } from './user-positions-combobox'

type Props = {
  user: UserDTO | null
  onClose: () => void
}

export function UserDetailsContent({ user, onClose }: Props) {
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
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
    lastName: false,
    email: false,
    positions: false,
  })

  const { data: session } = useSession()
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser()
  const { mutate: disableUser, isPending: isDisabling } = useDisableUser()
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser()

  const { data: positionsData } = usePositions({
    filters: {},
    pagination: { page: 1, limit: 200 },
  })

  const positionOptions = (positionsData?.items ?? []).map((p) => ({
    id: p.id,
    label: p.name,
  }))

  const firstNameError = touched.firstName && form.firstName.trim() === ''
  const lastNameError = touched.lastName && form.lastName.trim() === ''
  const emailError = touched.email && form.email.trim() === ''
  const positionsError = touched.positions && form.positions.length === 0

  const isFormValid =
    form.firstName.trim() !== '' &&
    form.lastName.trim() !== '' &&
    form.email.trim() !== '' &&
    form.positions.length > 0

  const isMutating = isUpdating || isDisabling || isDeleting

  if (!user) {
    return null
  }

  const resolvePositions = (): Position[] => {
    const allPositions = positionsData?.items ?? []
    return allPositions
      .filter((p) => form.positions.includes(p.id))
      .map(({ id, name, abbreviation, permissions, createdAt, updatedAt }) => ({
        id,
        name,
        abbreviation,
        permissions,
        createdAt,
        updatedAt,
      }))
  }

  const handleSave = () => {
    if (!isFormValid || !session?.user.id) {
      return
    }

    updateUser(
      {
        id: user.id,
        name: `${form.firstName.trim()} ${form.middleName.trim()} ${form.lastName.trim()}`
          .replace(/\s+/g, ' ')
          .trim(),
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || undefined,
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        positions: resolvePositions(),
        updatedById: session.user.id,
      },
      {
        onSuccess: () => {
          toast.success('User updated successfully')
          onClose()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  const handleDisable = () => {
    if (!session?.user.id) {
      return
    }

    disableUser(
      { id: user.id, deletedById: session.user.id },
      {
        onSuccess: () => {
          toast.success('User disabled successfully')
          setShowDisableConfirm(false)
          onClose()
        },
        onError: (error) => {
          toast.error(error.message)
          setShowDisableConfirm(false)
        },
      }
    )
  }

  const handleDelete = () => {
    if (!session?.user.id) {
      return
    }

    deleteUser(
      { id: user.id, deletedById: session.user.id },
      {
        onSuccess: () => {
          toast.success('User deleted successfully')
          setShowDeleteConfirm(false)
          onClose()
        },
        onError: (error) => {
          toast.error(error.message)
          setShowDeleteConfirm(false)
        },
      }
    )
  }

  return (
    <div className="font-roboto flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-1 pb-4">
        <div className="flex flex-col gap-[10px]">
          <Label className="text-[12px] font-bold text-black">
            First Name <span className="text-destructive">*</span>
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
          <Label className="text-[12px] font-bold text-black">Middle Name</Label>
          <Input
            className="border-tc_grayscale-500 h-[36px] w-full border-[1px] bg-white text-[14px]"
            value={form.middleName}
            onChange={(e) => setForm((prev) => ({ ...prev, middleName: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-[10px]">
          <Label className="text-[12px] font-bold text-black">
            Last Name <span className="text-destructive">*</span>
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
            Email <span className="text-destructive">*</span>
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
          <div className={positionsError ? 'rounded-md ring-1 ring-red-500' : ''}>
            <PositionsCombobox
              options={positionOptions}
              value={form.positions}
              defaultValue={[]}
              onValueChange={(value) => {
                setTouched((t) => ({ ...t, positions: true }))
                setForm((prev) => ({ ...prev, positions: value }))
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-background mt-auto flex gap-[10px] pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={isMutating}
          onClick={() => setShowDisableConfirm(true)}
          className="text-tc_primary-500 border-tc_primary-500 hover:bg-tc_primary-500 box-border h-[40px] flex-1 rounded-[8px] border bg-white px-4 py-0 text-[14px] leading-none hover:text-white"
        >
          Disable
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={isMutating}
          onClick={() => setShowDeleteConfirm(true)}
          className="box-border h-[40px] flex-1 rounded-[8px] border border-red-500 bg-white px-4 py-0 text-[14px] leading-none text-red-500 hover:bg-red-500 hover:text-white"
        >
          Delete
        </Button>

        <Button
          type="button"
          disabled={!isFormValid || isMutating}
          onClick={handleSave}
          className="bg-tc_primary-500 hover:bg-tc_primary-600 box-border h-[40px] flex-1 rounded-[8px] border border-transparent px-4 py-0 text-[14px] leading-none text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUpdating ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Disable confirmation */}
      <AlertDialog open={showDisableConfirm} onOpenChange={setShowDisableConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable User?</AlertDialogTitle>
            <AlertDialogDescription>
              {user.firstName} {user.lastName} will be disabled and will no longer be able to log
              in. This can be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDisabling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-tc_primary-500 hover:bg-tc_primary-600"
              disabled={isDisabling}
              onClick={handleDisable}
            >
              {isDisabling ? 'Disabling...' : 'Disable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {user.firstName} {user.lastName}. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
