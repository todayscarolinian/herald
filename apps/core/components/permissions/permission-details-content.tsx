'use client'

import type { PermissionDTO } from '@herald/types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'

type Props = {
  permission: PermissionDTO | null
  onClose: () => void
}

export function PermissionDetailsContent({ permission, onClose }: Props) {
  if (!permission) {
    return null
  }

  return (
    <div className="font-roboto flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-1 pb-4">
        <Badge className="bg-tc_primary-500 text-white">{permission.domain}</Badge>

        <Field orientation="horizontal" className="justify-between border-b pb-2">
          <FieldLabel>Name</FieldLabel>
          <span className="text-sm text-black">{permission.name}</span>
        </Field>

        <Field orientation="horizontal" className="justify-between border-b pb-2">
          <FieldLabel>Domain</FieldLabel>
          <span className="text-sm text-black">{permission.domain}</span>
        </Field>

        <Field orientation="horizontal" className="justify-between border-b pb-2">
          <FieldLabel>Description</FieldLabel>
          <span className="text-sm text-black">{permission.description}</span>
        </Field>

        <Field orientation="horizontal" className="justify-between border-b pb-2">
          <FieldLabel>Created</FieldLabel>
          <span className="text-sm text-black">{permission.createdAt}</span>
        </Field>

        <Field orientation="horizontal" className="justify-between">
          <FieldLabel>Updated</FieldLabel>
          <span className="text-sm text-black">{permission.updatedAt}</span>
        </Field>
      </div>

      <div className="bg-background mt-auto pt-4">
        <Button variant="outline" className="w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
