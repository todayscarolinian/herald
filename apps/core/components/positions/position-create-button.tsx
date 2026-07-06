'use client'

import type { Domain } from '@herald/types'
import { DOMAINS } from '@herald/utils'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useHasDomainAccess } from '@/hooks/use-has-domain-access'
import { useCreatePosition } from '@/lib/api/mutations/positionMutations'
import { useSession } from '@/lib/auth-client'

export function CreatePositionButton() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    abbreviation: '',
    domains: [] as Domain[],
  })

  const [touched, setTouched] = useState({
    name: false,
    abbreviation: false,
  })

  const { data: session } = useSession()
  const createPosition = useCreatePosition()
  const { hasAccess, isPending: isCheckingAccess } = useHasDomainAccess()

  if (isCheckingAccess || !hasAccess) {
    return null
  }

  const nameError = touched.name && form.name.trim() === ''
  const abbrError = touched.abbreviation && form.abbreviation.trim() === ''
  const isFormValid = form.name.trim() !== '' && form.abbreviation.trim() !== ''

  const handleReset = () => {
    setForm({ name: '', abbreviation: '', domains: [] })
    setTouched({ name: false, abbreviation: false })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) {
      toast.error('Please fill out all required fields.')
      return
    }

    createPosition.mutate(
      {
        name: form.name.trim(),
        abbreviation: form.abbreviation.trim(),
        domains: form.domains,
        createdById: session?.user.id ?? '',
      },
      {
        onSuccess: () => {
          toast.success('Position created')
          setOpen(false)
          handleReset()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
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
      <DialogTrigger className="p-2">
        <div className="text-tc_primary-500 hover:text-tc_primary-300 flex h-auto flex-col items-center gap-1 p-2">
          <Plus className="h-5 w-5" />
          <span className="text-sm font-medium">Create</span>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Create Position</DialogTitle>
            <DialogDescription>
              Creates a new organizational position. Click Create Position when you&apos;re done.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pos-name" className="font-bold">
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
              <Label htmlFor="pos-abbr" className="font-bold">
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
              <Label className="font-bold">Domains</Label>
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
                            setForm((prev) => ({ ...prev, domains: value ? [...DOMAINS] : [] }))
                          }}
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
                                setForm((prev) => ({
                                  ...prev,
                                  domains: value
                                    ? [...prev.domains, domain]
                                    : prev.domains.filter((d: Domain) => d !== domain),
                                }))
                              }}
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

          <DialogFooter>
            <DialogClose className="text-tc_primary-600 border-tc_primary-600 hover:bg-tc_primary-500 w-auto rounded-sm border-2 px-4 py-2 hover:text-white">
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={createPosition.isPending}
              className="bg-tc_primary-600 hover:bg-tc_primary-400 w-auto rounded-sm border-2 px-6 py-5 text-white"
            >
              {createPosition.isPending ? 'Creating...' : 'Create Position'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
