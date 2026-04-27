'use client'

import type { AuditLogFilters, AuditLogSortField } from '@herald/types'
import { ArrowDownUp, Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'

type MobileToolbarProps = {
  title: string
  search: string
  onSearchChange: (value: string) => void
  selectedFilters: AuditLogFilters
  onApplyFilters: (filters: AuditLogFilters) => void
  selectedSortField: AuditLogSortField
  availableSortFields: AuditLogSortField[]
  selectedSortDirection: 'asc' | 'desc'
  onApplySort: (field: AuditLogSortField, direction: 'asc' | 'desc') => void
}

export function MobileToolbar({
  title,
  search,
  onSearchChange,
  selectedFilters,
  onApplyFilters,
  selectedSortField,
  availableSortFields,
  selectedSortDirection,
  onApplySort,
}: MobileToolbarProps) {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AuditLogFilters>({})
  const [sortDialogOpen, setSortDialogOpen] = useState(false)
  const [draftSortField, setDraftSortField] = useState<AuditLogSortField>('action')
  const [draftSortDirection, setDraftSortDirection] = useState<'asc' | 'desc'>('asc')

  const activeFilterCount = selectedFilters.action ? 1 : 0

  const openFilterDialog = () => {
    setDraftFilters({ ...selectedFilters })
    setFilterDialogOpen(true)
  }

  const setDraftFilter = (key: keyof AuditLogFilters, value: string) => {
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
    const fallbackSortField = availableSortFields[0] ?? 'action'
    setDraftSortField(fallbackSortField)
    setDraftSortDirection('asc')
  }

  return (
    <div className="bg-background fixed right-0 bottom-0 left-0 flex items-center gap-2 border-t px-2 py-4 shadow-[0_-2px_4px_0_rgba(0,0,0,0.1)]">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${title.toLocaleLowerCase()}...`}
          className="border-tc_grayscale-900 bg-background w-full rounded-sm border py-2 pr-4 pl-10 text-sm outline-none placeholder:text-xs placeholder:font-semibold"
        />
      </div>

      <button
        onClick={openFilterDialog}
        className="bg-background flex h-10 w-10 items-center justify-center rounded-lg border border-black/40"
        aria-label={activeFilterCount > 0 ? `Filter (${activeFilterCount})` : 'Filter'}
      >
        <SlidersHorizontal size={16} />
      </button>

      <button
        onClick={openSortDialog}
        className="bg-background flex h-10 w-10 items-center justify-center rounded-lg border border-black/40"
      >
        <ArrowDownUp size={16} />
      </button>

      <FilterDrawer
        title={title}
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        selectedFilters={draftFilters}
        onSetFilter={setDraftFilter}
        onApply={applyFilters}
        onClear={clearFilter}
      />

      <SortDrawer
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

type FilterDrawerProps = {
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedFilters: AuditLogFilters
  onSetFilter: (key: keyof AuditLogFilters, value: string) => void
  onApply: () => void
  onClear: () => void
}

function FilterDrawer({
  title,
  open,
  onOpenChange,
  selectedFilters,
  onSetFilter,
  onApply,
  onClear,
}: FilterDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[92vh] w-full max-w-full flex-col overflow-hidden rounded-t-[8px] border-[1px] border-black/40 bg-white p-0 [&>button]:hidden"
      >
        <SheetHeader className="bg-tc_primary-500 flex flex-none px-6 py-4">
          <SheetTitle className="text-lg font-bold text-white">Filter {title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto px-6 py-5">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-black">Action</h3>
            <p className="text-muted-foreground text-xs">Filter logs by exact action value.</p>

            <input
              value={selectedFilters.action ?? ''}
              onChange={(event) => {
                onSetFilter('action', event.target.value)
              }}
              placeholder="ex. user.updated"
              className="border-tc_grayscale-900 bg-background w-full rounded-sm border px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>

          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>

          <Button
            className="bg-tc_primary-500 hover:bg-tc_primary-600 text-white"
            onClick={onApply}
          >
            Apply
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

type SortDrawerProps = {
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  availableSortFields: AuditLogSortField[]
  selectedSort: AuditLogSortField
  direction: 'asc' | 'desc'
  onSelectSort: (field: AuditLogSortField) => void
  onToggleDirection: () => void
  onApply: () => void
  onClear: () => void
}

function SortDrawer({
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
}: SortDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[92vh] w-full max-w-full flex-col overflow-hidden rounded-t-[8px] border-[1px] border-black/40 bg-white p-0 [&>button]:hidden"
      >
        <SheetHeader className="bg-tc_primary-500 flex flex-none px-6 py-4">
          <SheetTitle className="text-lg font-bold text-white">Sort {title}</SheetTitle>
        </SheetHeader>

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

          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>

          <Button
            className="bg-tc_primary-500 hover:bg-tc_primary-600 text-white"
            onClick={onApply}
          >
            Apply
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
