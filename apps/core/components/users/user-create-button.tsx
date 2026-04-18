import { Plus } from 'lucide-react'

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

import { PositionsCombobox } from './user-positions-combobox'

export function CreateButton() {
  return (
    <Dialog>
      <form>
        <DialogTrigger className="p-2">
          <div className="text-tc_primary-500 hover:text-tc_primary-300 flex h-auto flex-col items-center gap-1 p-2">
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">Create</span>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Creates a new user. Click Create User when youre done.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="name-1">
                First Name<span className="text-tc_primary-500">*</span>
              </Label>
              <Input id="name-1" name="name" placeholder="Jose" />
            </Field>
            <Field>
              <Label htmlFor="username-1">Middle Name</Label>
              <Input id="username-1" name="username" placeholder="Protacio" />
            </Field>
            <Field>
              <Label htmlFor="name-1">
                Last Name<span className="text-tc_primary-500">*</span>
              </Label>
              <Input id="name-1" name="name" placeholder="Rizal Mercado y Alonso Realonda" />
            </Field>
            <Field>
              <Label htmlFor="username-1">
                Email<span className="text-tc_primary-500">*</span>
              </Label>
              <Input
                id="username-1"
                name="username"
                placeholder="joseprotaciorizalmercadoyalonzorealonda@usc.edu.ph"
              />
            </Field>
            <Field>
              <Label htmlFor="username-1">
                Position<span className="text-tc_primary-500">*</span>
              </Label>
              <PositionsCombobox />
            </Field>
          </FieldGroup>
          <p className="text-muted-foreground pt-1 text-sm">
            <span className="font-semibold">Note:</span> A temporary password will be generated and
            sent to the users email. The user will be required to change their password on first
            login.
          </p>
          <DialogFooter>
            <DialogClose className="text-tc_primary-600 border-tc_primary-600 hover:bg-tc_primary-500 rounded-sm border-2 px-4 py-2 hover:text-white">
              Cancel
            </DialogClose>
            <Button
              type="submit"
              className="bg-tc_primary-600 py-2a hover:bg-tc_primary-400 h-full rounded-sm border-2 px-6 text-white"
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
