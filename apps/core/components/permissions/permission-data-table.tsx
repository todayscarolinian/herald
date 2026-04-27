'use client'

import type { PermissionDTO, PermissionFilters, PermissionSortField } from '@herald/types'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { PermissionDesktopToolbar } from './permission-desktop-toolbar'

type PermissionDataTableProps = {
  columns: ColumnDef<PermissionDTO, unknown>[]
  data: PermissionDTO[]
  onRowClick: (permission: PermissionDTO) => void
}

export function PermissionDataTable({ columns, data, onRowClick }: PermissionDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [permissionFilters, setPermissionFilters] = React.useState<PermissionFilters>({})
  const [searchTerm, setSearchTerm] = React.useState('')

  const searchedData = React.useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return data
    }

    return data.filter((permission) => {
      const name = permission.name?.toLowerCase() ?? ''
      const domain = permission.domain?.toLowerCase() ?? ''
      const description = permission.description?.toLowerCase() ?? ''

      return (
        name.includes(normalizedSearch) ||
        domain.includes(normalizedSearch) ||
        description.includes(normalizedSearch)
      )
    })
  }, [data, searchTerm])

  const table = useReactTable({
    data: searchedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const allowedSortFields: PermissionSortField[] = ['name', 'domain', 'createdAt', 'updatedAt']
  const activeSort = sorting.find(
    (sort): sort is SortingState[number] & { id: PermissionSortField } =>
      allowedSortFields.includes(sort.id as PermissionSortField)
  )
  const selectedSortField = activeSort?.id ?? 'name'
  const selectedSortDirection = activeSort?.desc ? 'desc' : 'asc'

  const searchValue = searchTerm

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    table.setPageIndex(0)
  }

  const applySort = (field: PermissionSortField, direction: 'asc' | 'desc') => {
    if (!table.getColumn(field)) {
      return
    }

    table.setSorting([
      {
        id: field,
        desc: direction === 'desc',
      },
    ])
    table.setPageIndex(0)
  }

  const applyFilters = (filters: PermissionFilters) => {
    setPermissionFilters(filters)
    table.setPageIndex(0)

    if (filters.domain) {
      table.getColumn('domain')?.setFilterValue(filters.domain)
    } else {
      table.getColumn('domain')?.setFilterValue(undefined)
    }
  }

  return (
    <div className="overflow-hidden">
      <PermissionDesktopToolbar
        title="Permissions"
        search={searchValue}
        onSearchChange={handleSearchChange}
        selectedFilters={permissionFilters}
        onApplyFilters={applyFilters}
        selectedSortField={selectedSortField}
        selectedSortDirection={selectedSortDirection}
        onApplySort={applySort}
      />
      <div className="rounded-md">
        <Table>
          <TableHeader className="bg-tc_grayscale-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="cursor-pointer"
                  onClick={() => onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Field orientation="horizontal" className="w-fit">
          <FieldLabel htmlFor="select-rows-per-page">Rows per page</FieldLabel>
          <Select defaultValue="10" onValueChange={(value) => table.setPageSize(Number(value))}>
            <SelectTrigger className="w-20" id="select-rows-per-page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground text-sm">
            {table.getFilteredRowModel().rows.length === 0 ? (
              '0 of 0'
            ) : (
              <>
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}{' '}
                of {table.getFilteredRowModel().rows.length}
              </>
            )}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
