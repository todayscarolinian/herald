'use client'
import type { PositionSortField } from '@herald/types'
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
import { useState } from 'react'

import { DesktopToolbar } from '@/components/shared'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
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

interface PositionsTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowClick?: (data: TData) => void
}

const pageSizes = [5, 10, 20, 50]

export function PositionsTable<TData, TValue>({
  data,
  columns,
  onRowClick,
}: PositionsTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      columnFilters,
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
      columnVisibility: {
        permissions: false,
      },
    },
  })

  const availableFilters = [
    'CREATE_ARTICLE',
    'EDIT_ARTICLE',
    'DELETE_ARTICLE',
    'PUBLISH_ARTICLE',
    'MANAGE_USERS',
  ]

  const availableSortFields = ['name', 'createdAt', 'updatedAt'].filter((field) =>
    table.getColumn(field)
  ) as PositionSortField[]

  const selectedSortField = sorting[0]?.id ? (sorting[0]?.id as PositionSortField) : 'name'
  const selectedSortDirection = sorting[0]?.desc ? 'desc' : 'asc'
  const selectedPermissions = (table.getColumn('permissions')?.getFilterValue() ?? []) as string[]

  const applySort = (field: string, direction: 'asc' | 'desc') => {
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

  const applyPermissionsFilter = (permissions: string[]) => {
    table.getColumn('permissions')?.setFilterValue(permissions)
    table.setPageIndex(0)
  }

  return (
    <div className="w-full">
      <DesktopToolbar
        title="Positions"
        search={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
        onSearchChange={(search) => table.getColumn('name')?.setFilterValue(search)}
        availableFilters={availableFilters}
        selectedFilters={selectedPermissions}
        onApplyFilters={applyPermissionsFilter}
        availableSortFields={availableSortFields}
        selectedSortField={selectedSortField}
        selectedSortDirection={selectedSortDirection}
        onApplySort={applySort}
      />
      <div className="rounded-none border-b">
        <Table>
          <TableHeader className="bg-tc_grayscale-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-0">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-tc_grayscale-900 px-4 py-2 text-xs font-semibold"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-[18px]">
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

      <div className="mt-3 flex items-center justify-end space-x-6 px-4 py-4">
        <div className="flex items-center space-x-2">
          <p className="mr-[10px] text-sm">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="mr-0 h-[44px] w-[104px] border border-black/40 px-4 py-[10px] text-[14px]">
              <SelectValue placeholder={`${table.getState().pagination.pageSize}`} />
            </SelectTrigger>
            <SelectContent align="end">
              {pageSizes.map((pageSize: number) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-muted-foreground flex items-center justify-center text-sm !text-black">
          {table.getFilteredRowModel().rows.length > 0 ? (
            <>
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              of {table.getFilteredRowModel().rows.length}
            </>
          ) : (
            '0 of 0'
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            className="hover:bg-muted mr-0 h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="!h-6 !w-6 text-black/60" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            className="hover:bg-muted ml-0 h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="!h-6 !w-6 text-black/60" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </div>
  )
}
