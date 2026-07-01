'use client'

import type { UserFilters, UserSortField } from '@herald/types'
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
import { usePositions } from '@/lib/api/queries/positionQueries'

import { DesktopToolbar } from './user-desktop-toolbar'

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowClick?: (row: TData) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [userFilters, setUserFilters] = React.useState<UserFilters>({})

  const { data: positionsData } = usePositions({
    filters: {},
    pagination: { page: 1, limit: 200 },
  })

  const availablePositions = (positionsData?.items ?? []).map((p) => ({
    id: p.id,
    label: p.name,
  }))

  const table = useReactTable({
    data,
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
      columnVisibility: {
        disabled: false,
        emailVerified: false,
      },
    },
  })

  const selectedSortField = sorting[0]?.id ? (sorting[0]?.id as UserSortField) : 'createdAt'
  const selectedSortDirection: 'asc' | 'desc' = sorting[0]
    ? sorting[0].desc
      ? 'desc'
      : 'asc'
    : 'desc'
  const searchValue = (table.getColumn('name')?.getFilterValue() as string) ?? ''

  const applySort = (field: UserSortField, direction: 'asc' | 'desc') => {
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

  const applyFilters = (filters: UserFilters) => {
    setUserFilters(filters)
    table.setPageIndex(0)

    if (filters.positionIds) {
      table.getColumn('positions')?.setFilterValue(filters.positionIds)
    } else {
      table.getColumn('positions')?.setFilterValue(undefined)
    }

    if (filters.disabled !== undefined) {
      table.getColumn('disabled')?.setFilterValue(filters.disabled)
    } else {
      table.getColumn('disabled')?.setFilterValue(undefined)
    }

    if (filters.emailVerified !== undefined) {
      table.getColumn('emailVerified')?.setFilterValue(filters.emailVerified)
    } else {
      table.getColumn('emailVerified')?.setFilterValue(undefined)
    }

    table.setPageIndex(0)
  }

  return (
    <div className="overflow-hidden">
      <DesktopToolbar
        title="Users"
        search={searchValue}
        onSearchChange={(value) => {
          table.getColumn('name')?.setFilterValue(value)
          table.setPageIndex(0)
        }}
        selectedFilters={userFilters}
        availablePositions={availablePositions}
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
                  onClick={() => onRowClick?.(row.original)}
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
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length}
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
