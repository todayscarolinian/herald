'use client'

import { UserDTO, UserFilters, UserSortField } from '@herald/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { useAllPositionsOptions } from '@/lib/api/queries/positionQueries'

import { UserCard } from './user-card'
import { MobileToolbar } from './user-mobile-toolbar'

const USER_SORT_FIELDS: UserSortField[] = ['name', 'email', 'createdAt', 'updatedAt']

type MobileDatagridProps = {
  users: UserDTO[]
  total: number
  pageIndex: number
  pageSize: number
  onPageChange: (pageIndex: number) => void
  isLoadingRows: boolean
  search: string
  onSearchChange: (value: string) => void
  selectedFilters: UserFilters
  onApplyFilters: (filters: UserFilters) => void
  selectedSortField: UserSortField
  selectedSortDirection: 'asc' | 'desc'
  onApplySort: (field: UserSortField, direction: 'asc' | 'desc') => void
  onClick: (user: UserDTO) => void
}

export default function MobileDatagrid({
  users,
  total,
  pageIndex,
  pageSize,
  onPageChange,
  isLoadingRows,
  search,
  onSearchChange,
  selectedFilters,
  onApplyFilters,
  selectedSortField,
  selectedSortDirection,
  onApplySort,
  onClick,
}: MobileDatagridProps) {
  const { data: positionsData } = useAllPositionsOptions()

  const availablePositions = (positionsData?.items ?? []).map((p) => ({
    id: p.id,
    label: p.name,
  }))

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1
  const canPreviousPage = pageIndex > 0
  const canNextPage = pageIndex + 1 < totalPages

  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-0 py-3 sm:grid-cols-2">
        {isLoadingRows
          ? Array.from({ length: pageSize }, (_, i) => `loading-card-${i}`).map((key) => (
              <Skeleton key={key} className="h-24 w-full rounded-md" />
            ))
          : users.map((u) => <UserCard key={u.id} user={u} onClick={() => onClick(u)} />)}
      </div>

      <div className="mt-4 mb-12 flex items-center justify-between px-0 py-3">
        <button
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={!canPreviousPage || isLoadingRows}
          className="flex h-6 w-6 items-center justify-center text-black/60 disabled:opacity-30"
        >
          <ChevronLeft className="h-6 w-6 text-black/60" strokeWidth={1.5} />
        </button>

        <div className="text-sm text-black">
          {total === 0
            ? '0 of 0'
            : `${pageIndex * pageSize + 1}-${Math.min((pageIndex + 1) * pageSize, total)} of ${total}`}
        </div>

        <button
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={!canNextPage || isLoadingRows}
          className="flex h-6 w-6 items-center justify-center text-black/60 disabled:opacity-30"
        >
          <ChevronRight className="h-6 w-6 text-black/60" strokeWidth={1.5} />
        </button>
      </div>

      <MobileToolbar
        title="Users"
        search={search}
        onSearchChange={onSearchChange}
        availablePositions={availablePositions}
        selectedFilters={selectedFilters}
        availableSortFields={USER_SORT_FIELDS}
        selectedSortField={selectedSortField}
        selectedSortDirection={selectedSortDirection}
        onApplyFilters={onApplyFilters}
        onApplySort={onApplySort}
      />
    </>
  )
}
