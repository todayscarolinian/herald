'use client'

import type { AuditLogDTO, AuditLogFilters, AuditLogSortField } from '@herald/types'
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
import { Sheet, SheetContent, SheetFooter } from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { DesktopToolbar } from './audit-log-desktop-toolbar'

type DataTableProps = {
  columns: ColumnDef<AuditLogDTO, unknown>[]
  data: AuditLogDTO[]
}

export function DataTable({ columns, data }: DataTableProps) {
  const [selectedRow, setSelectedRow] = React.useState<AuditLogDTO | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [auditLogFilters, setAuditLogFilters] = React.useState<AuditLogFilters>({})

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
    },
  })

  const allowedSortFields: AuditLogSortField[] = ['action', 'timestamp']
  const activeSort = sorting.find(
    (sort): sort is SortingState[number] & { id: AuditLogSortField } =>
      allowedSortFields.includes(sort.id as AuditLogSortField)
  )
  const selectedSortField = activeSort?.id ?? 'action'
  const selectedSortDirection = activeSort?.desc ? 'desc' : 'asc'

  const searchValue = (table.getColumn('action')?.getFilterValue() as string) ?? ''

  const applySort = (field: AuditLogSortField, direction: 'asc' | 'desc') => {
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

  const applyFilters = (filters: AuditLogFilters) => {
    setAuditLogFilters(filters)
    table.setPageIndex(0)

    if (filters.action) {
      table.getColumn('action')?.setFilterValue(filters.action)
    } else {
      table.getColumn('action')?.setFilterValue(undefined)
    }

    table.setPageIndex(0)
  }

  return (
    <div className="overflow-hidden">
      <DesktopToolbar
        title="Audit Logs"
        search={searchValue}
        onSearchChange={(value) => {
          table.getColumn('action')?.setFilterValue(value)
          table.setPageIndex(0)
        }}
        selectedFilters={auditLogFilters}
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
                  onClick={() => setSelectedRow(row.original)}
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
      <Sheet open={!!selectedRow} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <SheetContent className="p-4 sm:max-w-2xl">
          {selectedRow ? (
            <div className="mt-4 flex h-full flex-col gap-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedRow.action}</h2>
                <div className="text-muted-foreground mt-2 text-sm">{selectedRow.timestamp}</div>
              </div>

              <div className="border-tc_accent_black-300 border" />

              <div className="grid gap-3">
                <Field orientation="horizontal" className="justify-between">
                  <FieldLabel>Audit Log ID</FieldLabel>
                  <span className="text-sm">{selectedRow.id}</span>
                </Field>

                <Field orientation="horizontal" className="justify-between">
                  <FieldLabel>Performer ID</FieldLabel>
                  <span className="text-sm">{selectedRow.performerId}</span>
                </Field>

                <Field orientation="horizontal" className="justify-between">
                  <FieldLabel>Target ID</FieldLabel>
                  <span className="text-sm">{selectedRow.targetId}</span>
                </Field>

                <Field orientation="horizontal" className="justify-between">
                  <FieldLabel>Timestamp</FieldLabel>
                  <span className="text-sm">{selectedRow.timestamp}</span>
                </Field>
              </div>

              <SheetFooter className="mt-auto px-0">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedRow(null)}
                >
                  Close
                </Button>
              </SheetFooter>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
