'use client'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'

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

export type Position = {
  id: string
  name: string
  abbreviation: string
  userCount: number
  createdOn: string
}

interface Props {
  positions: Position[]
  onRowClick?: (position: Position) => void
}

const columns: ColumnDef<Position>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'abbreviation', header: 'Abbreviation' },
  { accessorKey: 'userCount', header: 'User Count' },
  { accessorKey: 'createdOn', header: 'Created On' },
]

const pageSizes = [5, 10, 20, 50]

export function PositionsTable({ positions, onRowClick }: Props) {
  const table = useReactTable({
    data: positions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="w-full">
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

      <div className="flex items-center justify-end space-x-6 px-4 py-4">
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
