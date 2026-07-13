'use client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { DesktopToolbar } from '@/components/positions'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
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

interface PositionsTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowClick?: (data: TData) => void
  total: number
  pageIndex: number
  pageSize: number
  pageCount: number
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
  isLoadingRows: boolean
  search: string
  onSearchChange: (value: string) => void
  selectedDomains: string[]
  onApplyDomains: (domains: string[]) => void
  selectedSortField: string
  selectedSortDirection: 'asc' | 'desc'
  onApplySort: (field: string, direction: 'asc' | 'desc') => void
}

const pageSizes = [5, 10, 20, 50]

export function PositionsTable<TData, TValue>({
  data,
  columns,
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
  selectedDomains,
  onApplyDomains,
  selectedSortField,
  selectedSortDirection,
  onApplySort,
}: PositionsTableProps<TData, TValue>) {
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
        domains: false,
      },
    },
  })

  const canPreviousPage = pageIndex > 0
  const canNextPage = pageIndex + 1 < pageCount

  const rangeStart = total === 0 ? 0 : pageIndex * pageSize + 1
  const rangeEnd = Math.min((pageIndex + 1) * pageSize, total)

  return (
    <div className="w-full">
      <DesktopToolbar
        title="Positions"
        search={search}
        onSearchChange={onSearchChange}
        selectedFilters={selectedDomains}
        onApplyFilters={onApplyDomains}
        selectedSortField={selectedSortField}
        selectedSortDirection={selectedSortDirection}
        onApplySort={onApplySort}
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
            {isLoadingRows ? (
              Array.from({ length: pageSize }, (_, i) => `loading-row-${i}`).map((key) => (
                <TableRow key={key}>
                  <TableCell colSpan={columns.length} className="px-4 py-[18px]">
                    <Skeleton className="h-6 w-full rounded-md" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
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
            value={`${pageSize}`}
            onValueChange={(value) => {
              onPageSizeChange(Number(value))
            }}
          >
            <SelectTrigger className="mr-0 h-[44px] w-[104px] border border-black/40 px-4 py-[10px] text-[14px]">
              <SelectValue placeholder={`${pageSize}`} />
            </SelectTrigger>
            <SelectContent align="end">
              {pageSizes.map((size: number) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-muted-foreground flex items-center justify-center text-sm !text-black">
          {total > 0 ? (
            <>
              {rangeStart}–{rangeEnd} of {total}
            </>
          ) : (
            '0 of 0'
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            className="hover:bg-muted mr-0 h-8 w-8 p-0"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!canPreviousPage || isLoadingRows}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="!h-6 !w-6 text-black/60" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            className="hover:bg-muted ml-0 h-8 w-8 p-0"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!canNextPage || isLoadingRows}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="!h-6 !w-6 text-black/60" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </div>
  )
}
