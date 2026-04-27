'use client'

import type { PermissionFilters, PermissionSortField } from '@herald/types'
import { ArrowDownUp, Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DOMAIN_OPTIONS = [
  'TC Official Website',
  'USC Days',
  'TC Digital Archives',
  'TC Herald',
] as const

type PermissionDesktopToolbarProps = {
  title: string
  search: string
  onSearchChange: (value: string) => void
  selectedFilters: PermissionFilters
  onApplyFilters: (filters: PermissionFilters) => void
  selectedSortField: PermissionSortField
  selectedSortDirection: 'asc' | 'desc'
  onApplySort: (field: PermissionSortField, direction: 'asc' | 'desc') => void
}

export function PermissionDesktopToolbar({
  title,
  search,
  onSearchChange,
  selectedFilters,
  onApplyFilters,
  selectedSortField,
  selectedSortDirection,
  onApplySort,
}: PermissionDesktopToolbarProps) {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<PermissionFilters>({})
  const [sortDialogOpen, setSortDialogOpen] = useState(false)
  const [draftSortField, setDraftSortField] = useState<PermissionSortField>('name')
  const [draftSortDirection, setDraftSortDirection] = useState<'asc' | 'desc'>('asc')

  const availableSortFields: PermissionSortField[] = ['name', 'domain', 'createdAt', 'updatedAt']
  const activeFilterCount = selectedFilters.domain ? 1 : 0

  const openFilterDialog = () => {
    setDraftFilters({ ...selectedFilters })
    setFilterDialogOpen(true)
  }

  const setDraftFilter = (key: keyof PermissionFilters, value: string) => {
    const trimmedValue = value.trim()

    setDraftFilters((current) => ({
      ...current,
      [key]: trimmedValue || undefined,
    }))
  }

  const applyFilters = () => {
    onApplyFilters(draftFilters)
    setFilterDialogOpen(false)
  }

  const clearFilter = () => {
    setDraftFilters({})
  }

  const openSortDialog = () => {
    setDraftSortField(selectedSortField)
    setDraftSortDirection(selectedSortDirection)
    setSortDialogOpen(true)
  }

  const applySort = () => {
    onApplySort(draftSortField, draftSortDirection)
    setSortDialogOpen(false)
  }

  const clearSort = () => {
    const fallbackSortField = availableSortFields[0] ?? 'name'
    setDraftSortField(fallbackSortField)
    setDraftSortDirection('asc')
  }

  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="relative h-12 flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

        <Input
          placeholder={`Search ${title.toLocaleLowerCase()}...`}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-tc_grayscale-900 h-12 pl-10 text-base font-medium placeholder:text-base"
        />
      </div>

      <button
        onClick={openFilterDialog}
        className="text-muted-foreground hover:text-foreground flex h-12 flex-col items-center justify-center gap-1 px-3 transition-colors"
      >
        <SlidersHorizontal className="h-6 w-6" />
        <span className="text-sm font-bold">
          Filter
          {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </span>
      </button>

      <button
        onClick={openSortDialog}
        className="text-muted-foreground hover:text-foreground flex h-12 flex-col items-center justify-center gap-1 px-3 transition-colors"
      >
        <ArrowDownUp className="h-6 w-6" />
        <span className="text-sm font-bold">Sort</span>
      </button>

      <FilterDialog
        title={title}
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        selectedFilters={draftFilters}
        onSetFilter={setDraftFilter}
        onApply={applyFilters}
        onClear={clearFilter}
      />

      <SortDialog
        title={title}
        open={sortDialogOpen}
        onOpenChange={setSortDialogOpen}
        availableSortFields={availableSortFields}
        selectedSort={draftSortField}
        direction={draftSortDirection}
        onSelectSort={setDraftSortField}
        onToggleDirection={() => {
          setDraftSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
        }}
        onApply={applySort}
        onClear={clearSort}
      />
    </div>
  )
}

type FilterDialogProps = {
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedFilters: PermissionFilters
  onSetFilter: (key: keyof PermissionFilters, value: string) => void
  onApply: () => void
  onClear: () => void
}

function FilterDialog({
  title,
  open,
  onOpenChange,
  selectedFilters,
  onSetFilter,
  onApply,
  onClear,
}: FilterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-roboto flex h-[auto] max-h-[90dvh] !max-w-xl min-w-[320px] flex-col rounded-none p-0 [&>button]:text-white">
        <div className="bg-tc_primary-500 flex flex-none items-center justify-between px-6 py-4">
          <DialogTitle className="text-lg font-bold text-white">Filter {title}</DialogTitle>
        </div>

        <div className="space-y-6 overflow-y-auto px-6 py-5">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-black">Domain</h3>
            <p className="text-muted-foreground text-xs">Filter permissions by domain.</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {DOMAIN_OPTIONS.map((domain) => {
                const checked = selectedFilters.domain === domain

                return (
                  <Label
                    key={domain}
                    className="hover:bg-tc_grayscale-100 flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(nextChecked) => {
                        onSetFilter('domain', nextChecked ? domain : '')
                      }}
                      aria-label={`Filter by ${domain}`}
                    />
                    <span className="text-xs font-semibold">{domain}</span>
                  </Label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>

          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button
            className="bg-tc_primary-500 hover:bg-tc_primary-600 text-white"
            onClick={onApply}
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type SortDialogProps = {
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  availableSortFields: PermissionSortField[]
  selectedSort: PermissionSortField
  direction: 'asc' | 'desc'
  onSelectSort: (field: PermissionSortField) => void
  onToggleDirection: () => void
  onApply: () => void
  onClear: () => void
}

function SortDialog({
  title,
  open,
  onOpenChange,
  availableSortFields,
  selectedSort,
  direction,
  onSelectSort,
  onToggleDirection,
  onApply,
  onClear,
}: SortDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-roboto flex h-[auto] max-h-[90dvh] !max-w-xl min-w-[320px] flex-col rounded-none p-0 [&>button]:text-white">
        <div className="bg-tc_primary-500 flex flex-none items-center justify-between px-6 py-4">
          <DialogTitle className="text-lg font-bold text-white">Sort {title}</DialogTitle>
        </div>

        <div className="space-y-6 overflow-y-auto px-6 py-5">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-black">Sort Field</h3>
            <p className="text-muted-foreground text-xs">
              Choose which column to sort by, then set the direction.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {availableSortFields.map((field) => {
                const checked = selectedSort === field

                return (
                  <Label
                    key={field}
                    className="hover:bg-tc_grayscale-100 flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onSelectSort(field)}
                      aria-label={`Sort by ${field}`}
                    />
                    <span className="text-xs font-semibold">{field}</span>
                  </Label>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-black">Direction</h3>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={direction === 'asc' ? 'default' : 'outline'}
                className={
                  direction === 'asc' ? 'bg-tc_primary-500 hover:bg-tc_primary-600 text-white' : ''
                }
                onClick={() => {
                  if (direction === 'desc') {
                    onToggleDirection()
                  }
                }}
              >
                Ascending
              </Button>
              <Button
                type="button"
                variant={direction === 'desc' ? 'default' : 'outline'}
                className={
                  direction === 'desc' ? 'bg-tc_primary-500 hover:bg-tc_primary-600 text-white' : ''
                }
                onClick={() => {
                  if (direction === 'asc') {
                    onToggleDirection()
                  }
                }}
              >
                Descending
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>

          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button
            className="bg-tc_primary-500 hover:bg-tc_primary-600 text-white"
            onClick={onApply}
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
