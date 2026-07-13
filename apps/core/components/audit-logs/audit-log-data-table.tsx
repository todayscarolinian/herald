'use client'

import type { AuditLogDTO, AuditLogFilters, AuditLogSortField } from '@herald/types'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
import { Skeleton } from '@/components/ui/skeleton'
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
  onRowClick?: (auditLog: AuditLogDTO) => void
  total: number
  pageIndex: number
  pageSize: number
  pageCount: number
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
  isLoadingRows: boolean
  search: string
  onSearchChange: (value: string) => void
  selectedFilters: AuditLogFilters
  onApplyFilters: (filters: AuditLogFilters) => void
  selectedSortField: AuditLogSortField
  selectedSortDirection: 'asc' | 'desc'
  onApplySort: (field: AuditLogSortField, direction: 'asc' | 'desc') => void
}

export function DataTable({
  columns,
  data,
  onRowClick,
  total,
  pageIndex,
  pageSize,
  pageCount,
  onPageChange,
  onPageSizeChange,
  isLoadingRows,
  search,
  onSearchChange,
  selectedFilters,
  onApplyFilters,
  selectedSortField,
  selectedSortDirection,
  onApplySort,
}: DataTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    pageCount,
    state: {
      pagination: { pageIndex, pageSize },
    },
  })

  const rangeStart = total === 0 ? 0 : pageIndex * pageSize + 1
  const rangeEnd = Math.min((pageIndex + 1) * pageSize, total)
  const canPreviousPage = pageIndex > 0
  const canNextPage = pageIndex + 1 < pageCount

  return (
    <div className="overflow-hidden">
      <DesktopToolbar
        title="Audit Logs"
        search={search}
        onSearchChange={onSearchChange}
        selectedFilters={selectedFilters}
        onApplyFilters={onApplyFilters}
        selectedSortField={selectedSortField}
        selectedSortDirection={selectedSortDirection}
        onApplySort={onApplySort}
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
            {isLoadingRows ? (
              Array.from({ length: pageSize }, (_, i) => `loading-row-${i}`).map((key) => (
                <TableRow key={key}>
                  <TableCell colSpan={columns.length} className="px-4 py-[18px]">
                    <Skeleton className="h-6 w-full rounded-md" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
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
          <Select value={`${pageSize}`} onValueChange={(value) => onPageSizeChange(Number(value))}>
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
            {total > 0 ? (
              <>
                {rangeStart}–{rangeEnd} of {total}
              </>
            ) : (
              '0 of 0'
            )}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={!canPreviousPage || isLoadingRows}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={!canNextPage || isLoadingRows}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
