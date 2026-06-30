'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import { Field, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateUser } from '@/lib/api/mutations/userMutations'
import { usePositions } from '@/lib/api/queries/positionQueries'
import { useSession } from '@/lib/auth-client'

import { PositionsCombobox } from './user-positions-combobox'

const EMPTY_FORM = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  positions: [] as string[],
}

export function CreateButton() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data: session } = useSession()
  const { mutate: createUser, isPending } = useCreateUser()
  const { data: positionsData } = usePositions({
    filters: {},
    pagination: { page: 1, limit: 200 },
  })

  const positionOptions = (positionsData?.items ?? []).map((p) => ({
    id: p.id,
    label: p.name,
  }))

  const isValid =
    form.firstName.trim() !== '' &&
    form.lastName.trim() !== '' &&
    form.email.trim() !== '' &&
    form.positions.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!session || !session.user) {
      toast.error('You must be logged in to create a user.')
      return
    }

    if (!isValid) {
      toast.error('Please fill in all required fields and select at least one position.')
      return
    }

    createUser(
      {
        id: '',
        name: `${form.firstName.trim()} ${form.middleName.trim()} ${form.lastName.trim()}`
          .replace(/\s+/g, ' ')
          .trim(),
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || undefined,
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        positions: form.positions,
        createdById: session.user.id,
      },
      {
        onSuccess: () => {
          toast.success('User created successfully')
          setForm(EMPTY_FORM)
          setOpen(false)
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="p-2">
        <div className="text-tc_primary-500 hover:text-tc_primary-300 flex h-auto flex-col items-center gap-1 p-2">
          <Plus className="h-5 w-5" />
          <span className="text-sm font-medium">Create</span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Create User</DialogTitle>
            <DialogDescription>
              Creates a new user. Click Create User when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="create-firstName" className="font-bold">
                First Name<span className="text-tc_primary-500">*</span>
              </Label>
              <Input
                id="create-firstName"
                name="firstName"
                placeholder="Jose"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
              />
            </Field>
            <Field>
              <Label htmlFor="create-middleName" className="font-bold">
                Middle Name
              </Label>
              <Input
                id="create-middleName"
                name="middleName"
                placeholder="Protacio"
                value={form.middleName}
                onChange={(e) => setForm((prev) => ({ ...prev, middleName: e.target.value }))}
              />
            </Field>
            <Field>
              <Label htmlFor="create-lastName" className="font-bold">
                Last Name<span className="text-tc_primary-500">*</span>
              </Label>
              <Input
                id="create-lastName"
                name="lastName"
                placeholder="Rizal"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
              />
            </Field>
            <Field>
              <Label htmlFor="create-email" className="font-bold">
                Email<span className="text-tc_primary-500">*</span>
              </Label>
              <Input
                id="create-email"
                name="email"
                type="email"
                placeholder="jose@usc.edu.ph"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </Field>
            <Field>
              <Label htmlFor="create-positions" className="font-bold">
                Position<span className="text-tc_primary-500">*</span>
              </Label>
              <PositionsCombobox
                options={positionOptions}
                value={form.positions}
                defaultValue={[]}
                onValueChange={(value) => setForm((prev) => ({ ...prev, positions: value }))}
              />
            </Field>
          </FieldGroup>
          <p className="text-muted-foreground pt-1 text-sm">
            <span className="font-semibold">Note:</span> A temporary password will be generated and
            sent to the user&apos;s email. The user will be required to change their password on
            first login.
          </p>
          <DialogFooter>
            <DialogClose
              type="button"
              className="text-tc_primary-600 border-tc_primary-600 hover:bg-tc_primary-500 w-auto rounded-sm border-2 px-4 py-2 hover:text-white"
            >
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={!isValid || isPending}
              className="bg-tc_primary-600 hover:bg-tc_primary-400 w-auto rounded-sm border-2 px-6 py-5 text-white"
            >
              {isPending ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
