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
import { PositionsCombobox } from '@/components/users/user-positions-combobox'

import { DesktopToolbar } from './user-desktop-toolbar'

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [selectedRow, setSelectedRow] = React.useState<TData | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [userFilters, setUserFilters] = React.useState<UserFilters>({})

  const availablePositions = [
    {
      id: 'CTO',
      label: 'Chief Technology Officer',
    },
    {
      id: 'WR',
      label: 'Writer',
    },
    {
      id: 'EIC',
      label: 'Editor-in-Chief',
    },
  ]

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

  const selectedSortField = sorting[0]?.id ? (sorting[0]?.id as UserSortField) : 'createdAt'
  const selectedSortDirection = sorting[0]?.desc ? 'desc' : 'asc'
  const searchValue = (table.getColumn('firstName')?.getFilterValue() as string) ?? ''

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
          table.getColumn('firstName')?.setFilterValue(value)
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
