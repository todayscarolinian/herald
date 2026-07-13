'use client'

import { AuditLogDTO, AuditLogFilters, AuditLogSortField } from '@herald/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'

import { AuditLogCard } from './audit-log-card'
import { MobileToolbar } from './audit-log-mobile-toolbar'

const AUDIT_LOG_SORT_FIELDS: AuditLogSortField[] = ['action', 'timestamp']

type MobileDatagridProps = {
  auditLogs: AuditLogDTO[]
  total: number
  pageIndex: number
  pageSize: number
  onPageChange: (pageIndex: number) => void
  isLoadingRows: boolean
  search: string
  onSearchChange: (value: string) => void
  selectedFilters: AuditLogFilters
  onApplyFilters: (filters: AuditLogFilters) => void
  selectedSortField: AuditLogSortField
  selectedSortDirection: 'asc' | 'desc'
  onApplySort: (field: AuditLogSortField, direction: 'asc' | 'desc') => void
  onClick: (auditLog: AuditLogDTO) => void
}

export function MobileDatagrid({
  auditLogs,
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
          : auditLogs.map((u) => (
              <AuditLogCard key={u.id} auditLog={u} onClick={() => onClick(u)} />
            ))}
      </div>

      <div className="mt-4 mb-12 flex items-center justify-between px-0 py-3">
        <button
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={!canPreviousPage || isLoadingRows}
          className="flex h-6 w-6 items-center justify-center text-black/60 disabled:opacity-30"
          aria-label="Previous Page"
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
          aria-label="Next Page"
        >
          <ChevronRight className="h-6 w-6 text-black/60" strokeWidth={1.5} />
        </button>
      </div>

      <MobileToolbar
        title="Audit Logs"
        search={search}
        onSearchChange={onSearchChange}
        selectedFilters={selectedFilters}
        availableSortFields={AUDIT_LOG_SORT_FIELDS}
        selectedSortField={selectedSortField}
        selectedSortDirection={selectedSortDirection}
        onApplyFilters={onApplyFilters}
        onApplySort={onApplySort}
      />
    </>
  )
}
