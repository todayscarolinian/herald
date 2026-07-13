'use client'

import { PositionDTO } from '@herald/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'

import { PositionCard } from './position-card'
import { MobileToolbar } from './position-mobile-toolbar'

type MobileDatagridProps = {
  positions: PositionDTO[]
  total: number
  pageIndex: number
  pageSize: number
  onPageChange: (pageIndex: number) => void
  isLoadingRows: boolean
  search: string
  onSearchChange: (value: string) => void
  selectedFilters: string[]
  onApplyFilters: (filters: string[]) => void
  selectedSortField: string
  selectedSortDirection: 'asc' | 'desc'
  onApplySort: (field: string, direction: 'asc' | 'desc') => void
  onClick: (position: PositionDTO) => void
}

export default function MobileDatagrid({
  positions,
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
          : positions.map((p) => (
              <PositionCard key={p.id} position={p} onClick={() => onClick(p)} />
            ))}
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
        title="Positions"
        search={search}
        onSearchChange={onSearchChange}
        selectedFilters={selectedFilters}
        selectedSortField={selectedSortField}
        selectedSortDirection={selectedSortDirection}
        onApplyFilters={onApplyFilters}
        onApplySort={onApplySort}
      />
    </>
  )
}
