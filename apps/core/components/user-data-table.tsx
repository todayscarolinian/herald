'use client'

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
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { PositionsCombobox } from '@/components/user-positions-combobox'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [selectedRow, setSelectedRow] = React.useState<TData | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

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
  })

  return (
    <div className="overflow-hidden p-4 pt-0 pb-0">
      <div className="p flex items-center pt-4 pb-4">
        <div className="relative w-full">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

          <Input
            placeholder="Search users..."
            value={(table.getColumn('firstName')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('firstName')?.setFilterValue(event.target.value)}
            className="pl-10"
          />
        </div>

        <div className="ml-4 flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1"
            onClick={() =>
              table
                .getColumn('createdAt')
                ?.toggleSorting(table.getColumn('createdAt')?.getIsSorted() === 'asc')
            }
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <span className="text-sm">Filter</span>
        </div>

        <div className="ml-4 flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1"
            onClick={() =>
              table
                .getColumn('createdAt')
                ?.toggleSorting(table.getColumn('createdAt')?.getIsSorted() === 'asc')
            }
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <span className="text-sm">Sort</span>
        </div>
      </div>
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
          <div className="mt-4 flex h-full flex-col">
            <div className="flex h-full flex-col gap-3">
              <div className="flex w-full flex-col items-start justify-between">
                <h2 className="text-2xl font-bold">Test User</h2>

                <div className="text-muted-foreground mt-4 flex w-full items-center justify-between pt-1 text-sm">
                  <div>testuser@example.com</div>
                  <div>0/01/23</div>
                </div>
              </div>

              <div className="border-tc_accent_black-300 border" />

              <span className="text-lg font-extrabold">User Details</span>

              <FieldGroup>
                <Field>
                  <Label htmlFor="first-name" className="text-tc_grayscale-800">
                    First Name <span className="text-tc_primary-500">*</span>
                  </Label>
                  <Input id="first-name" name="firstName" defaultValue="Jose" />
                </Field>
                <Field>
                  <Label htmlFor="middle-name">Middle Name</Label>
                  <Input id="middle-name" name="middleName" defaultValue="Protacio" />
                </Field>
                <Field>
                  <Label htmlFor="last-name">
                    Last Name<span className="text-tc_primary-500">*</span>
                  </Label>
                  <Input
                    id="last-name"
                    name="lastName"
                    defaultValue="Rizal Mercado y Alonso Realonda"
                  />
                </Field>
                <Field>
                  <Label htmlFor="email">
                    Email<span className="text-tc_primary-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    defaultValue="joseprotaciorizalmercadoyalonzorealonda@usc.edu.ph"
                  />
                </Field>
                <Field>
                  <Label htmlFor="position">
                    Position<span className="text-tc_primary-500">*</span>
                  </Label>
                  <PositionsCombobox />
                </Field>
              </FieldGroup>

              <SheetFooter className="mt-auto grid w-full grid-cols-2 px-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-tc_primary-500 text-tc_primary-500 hover:bg-tc_primary-500 w-full border-2 hover:text-white"
                >
                  Delete
                </Button>

                <Button
                  type="submit"
                  className="bg-tc_primary-500 hover:bg-tc_primary-300 w-full rounded-sm border-2 text-white"
                >
                  Save
                </Button>
              </SheetFooter>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
