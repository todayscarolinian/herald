'use client'

import { ArrowDownUp, Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type DesktopToolbarProps = {
  title: string
  search: string
  onSearchChange: (value: string) => void
  selectedFilters: string[]
  onApplyFilters: (filters: string[]) => void
  selectedSortField: string
  selectedSortDirection: 'asc' | 'desc'
  onApplySort: (field: string, direction: 'asc' | 'desc') => void
}

export function DesktopToolbar({
  title,
  search,
  onSearchChange,
  selectedFilters,
  onApplyFilters,
  selectedSortField,
  selectedSortDirection,
  onApplySort,
}: DesktopToolbarProps) {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<string[]>([])
  const [sortDialogOpen, setSortDialogOpen] = useState(false)
  const [draftSortField, setDraftSortField] = useState<string>('')
  const [draftSortDirection, setDraftSortDirection] = useState<'asc' | 'desc'>('asc')

  const availableFilters = [
    'CREATE_ARTICLE',
    'EDIT_ARTICLE',
    'DELETE_ARTICLE',
    'PUBLISH_ARTICLE',
    'MANAGE_USERS',
  ]

  const availableSortFields = ['name', 'createdAt', 'updatedAt']

  const openFilterDialog = () => {
    setDraftFilters(selectedFilters)
    setFilterDialogOpen(true)
  }

  const toggleDraftFilter = (filter: string) => {
    setDraftFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]
    )
  }

  const applyFilters = () => {
    onApplyFilters(draftFilters)
    setFilterDialogOpen(false)
  }

  const clearFilter = () => {
    setDraftFilters([])
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
    const fallbackSortField = availableSortFields[0] ?? ''
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
          {selectedFilters.length > 0 ? ` (${selectedFilters.length})` : ''}
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
        availableFilters={availableFilters}
        selectedFilters={draftFilters}
        onToggleFilter={toggleDraftFilter}
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
  availableFilters: string[]
  selectedFilters: string[]
  onToggleFilter: (filter: string) => void
  onApply: () => void
  onClear: () => void
}

function FilterDialog({
  title,
  open,
  onOpenChange,
  availableFilters,
  selectedFilters,
  onToggleFilter,
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
            <h3 className="text-sm font-bold text-black">Available Filters</h3>
            <p className="text-muted-foreground text-xs">Select one or more filters.</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {availableFilters.map((filter) => {
                const checked = selectedFilters.includes(filter)

                return (
                  <Label
                    key={filter}
                    className="hover:bg-tc_grayscale-100 flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggleFilter(filter)}
                      aria-label={`Filter by ${filter}`}
                    />
                    <span className="text-xs font-semibold">
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </span>
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
  availableSortFields: string[]
  selectedSort: string
  direction: 'asc' | 'desc'
  onSelectSort: (field: string) => void
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
                    <span className="text-xs font-semibold">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </span>
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
