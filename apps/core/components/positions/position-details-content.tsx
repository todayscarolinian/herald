'use client'

import { type Domain, Position } from '@herald/types'
import { DOMAINS } from '@herald/utils'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useHasDomainAccess } from '@/hooks/use-has-domain-access'
import { useDeletePosition, useUpdatePosition } from '@/lib/api/mutations/positionMutations'
import { useSession } from '@/lib/auth-client'

type Props = {
  position: Position | null
  onClose: () => void
}

export function PositionDetailsContent({ position, onClose }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: session } = useSession()
  const updatePosition = useUpdatePosition()
  const deletePosition = useDeletePosition()
  const { hasAccess, isPending: isCheckingAccess } = useHasDomainAccess()
  const canEdit = !isCheckingAccess && hasAccess

  const [form, setForm] = useState(() => ({
    name: position?.name ?? '',
    abbreviation: position?.abbreviation ?? '',
    domains: position?.domains ?? [],
  }))

  const [touched, setTouched] = useState({
    name: false,
    abbreviation: false,
    domains: false,
  })

  const nameError = touched.name && form.name.trim() === ''
  const abbrError = touched.abbreviation && form.abbreviation.trim() === ''

  const isFormValid = form.name.trim() !== '' && form.abbreviation.trim() !== ''

  if (!position) {
    return null
  }

  const handleSave = () => {
    updatePosition.mutate(
      {
        id: position.id,
        name: form.name.trim(),
        abbreviation: form.abbreviation.trim(),
        domains: form.domains,
        updatedById: session?.user.id ?? '',
      },
      {
        onSuccess: () => toast.success('Position updated'),
        onError: (error) => toast.error(error.message),
      }
    )
  }

  const handleDelete = () => {
    deletePosition.mutate(
      { id: position.id, deletedById: session?.user.id ?? '' },
      {
        onSuccess: () => {
          toast.success('Position deleted')
          onClose()
        },
        onError: (error) => toast.error(error.message),
      }
    )
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
              nameError ? 'border-red-500' : 'border-tc_grayscale-500'
            }`}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            readOnly={!canEdit}
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
            readOnly={!canEdit}
          />
        </div>

        <div className="flex flex-col gap-[10px]">
          <Label className="text-[12px] font-bold text-black">
            Domains <span className="text-destructive">*</span>
          </Label>

          <div className="border-tc_grayscale-500 overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead className="w-16 text-center">
                    <Checkbox
                      checked={form.domains.length === DOMAINS.length}
                      indeterminate={
                        form.domains.length > 0 && form.domains.length < DOMAINS.length
                      }
                      onCheckedChange={(value) => {
                        setTouched((t) => ({ ...t, domains: true }))
                        setForm((prev) => ({ ...prev, domains: value ? [...DOMAINS] : [] }))
                      }}
                      disabled={!canEdit}
                      aria-label="Select all domains"
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DOMAINS.map((domain) => {
                  const checked = form.domains.includes(domain)

                  return (
                    <TableRow key={domain}>
                      <TableCell>{domain}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            setTouched((t) => ({ ...t, domains: true }))
                            setForm((prev) => ({
                              ...prev,
                              domains: value
                                ? [...prev.domains, domain]
                                : prev.domains.filter((d: Domain) => d !== domain),
                            }))
                          }}
                          disabled={!canEdit}
                          aria-label={`Select ${domain}`}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="bg-background mt-auto flex gap-[10px] pt-4">
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deletePosition.isPending}
            className="text-tc_primary-500 border-tc_primary-500 hover:bg-tc_primary-500 box-border h-[40px] flex-1 rounded-[8px] border bg-white px-4 py-0 text-[14px] leading-none hover:text-white"
          >
            {deletePosition.isPending ? 'Deleting...' : 'Delete'}
          </Button>

          <Button
            disabled={!isFormValid || updatePosition.isPending}
            onClick={handleSave}
            className="bg-tc_primary-500 hover:bg-tc_primary-600 box-border h-[40px] flex-1 rounded-[8px] border border-transparent px-4 py-0 text-[14px] leading-none text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatePosition.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}

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
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
