'use client'

import type { UserFilters, UserSortField } from '@herald/types'
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
import { useAllPositionsOptions } from '@/lib/api/queries/positionQueries'

import { DesktopToolbar } from './user-desktop-toolbar'

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowClick?: (row: TData) => void
  total: number
  pageIndex: number
  pageSize: number
  pageCount: number
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
  isLoadingRows: boolean
  search: string
  onSearchChange: (value: string) => void
  selectedFilters: UserFilters
  onApplyFilters: (filters: UserFilters) => void
  selectedSortField: UserSortField
  selectedSortDirection: 'asc' | 'desc'
  onApplySort: (field: UserSortField, direction: 'asc' | 'desc') => void
}

export function DataTable<TData, TValue>({
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
}: DataTableProps<TData, TValue>) {
  const { data: positionsData } = useAllPositionsOptions()

  const availablePositions = (positionsData?.items ?? []).map((p) => ({
    id: p.id,
    label: p.name,
  }))

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
      columnVisibility: {
        disabled: false,
        emailVerified: false,
      },
    },
  })

  const rangeStart = total === 0 ? 0 : pageIndex * pageSize + 1
  const rangeEnd = Math.min((pageIndex + 1) * pageSize, total)
  const canPreviousPage = pageIndex > 0
  const canNextPage = pageIndex + 1 < pageCount

  return (
    <div className="overflow-hidden">
      <DesktopToolbar
        title="Users"
        search={search}
        onSearchChange={onSearchChange}
        selectedFilters={selectedFilters}
        availablePositions={availablePositions}
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
