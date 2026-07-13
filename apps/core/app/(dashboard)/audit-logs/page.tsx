'use client'

import { AuditLogDTO, AuditLogFilters, AuditLogSortField, DEFAULT_PAGINATION } from '@herald/types'
import { FolderOpen, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { columns, DataTable, MobileDatagrid } from '@/components/audit-logs'
import { AuditLogDetailsDrawer } from '@/components/audit-logs/audit-log-details-drawer'
import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/hooks/use-mobile'
import { useToastOnError } from '@/hooks/use-toast-on-error'
import { useAuditLogsInfinite } from '@/lib/api/queries/auditLogQueries'

const SEARCH_DEBOUNCE_MS = 300

export default function AuditLogsPage() {
  const isMobile = useIsMobile()
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogDTO | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Table page (0-based) and page size are independent from the server's
  // fetch batch size (see AUDIT_LOGS_SERVER_BATCH_SIZE) — useAuditLogsInfinite
  // accumulates server batches and we window into them here.
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.limit)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<AuditLogFilters>({})
  const [sortField, setSortField] = useState<AuditLogSortField>('timestamp')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [searchInput])

  // Reset to the first page whenever the query itself changes. Adjusting
  // state during render (rather than in a useEffect) avoids an extra
  // cascading render pass — see https://react.dev/learn/you-might-not-need-an-effect.
  const queryKey = JSON.stringify({ search, filters, sortField, sortDirection, pageSize })
  const [prevQueryKey, setPrevQueryKey] = useState(queryKey)
  if (queryKey !== prevQueryKey) {
    setPrevQueryKey(queryKey)
    setPageIndex(0)
  }

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAuditLogsInfinite({
    filters: { ...filters, search: search || undefined },
    sort: { field: sortField, direction: sortDirection },
  })

  const allItems = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])
  const total = data?.pages[0]?.total ?? 0
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1
  const pageReady = allItems.length >= Math.min(total, (pageIndex + 1) * pageSize)

  // Keep the cache topped up: the page being viewed always takes priority
  // (that's what pageReady/isLoadingRows gate on). Once it's satisfied, keep
  // going and silently prefetch one page ahead in the background, so
  // clicking "next" is instant instead of waiting on a fresh request. Runs
  // again after each fetch resolves until both are satisfied or the server
  // is exhausted.
  useEffect(() => {
    const target = pageReady ? (pageIndex + 2) * pageSize : (pageIndex + 1) * pageSize
    if (allItems.length < target && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [
    pageIndex,
    pageSize,
    pageReady,
    allItems.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ])

  const pageItems = useMemo(
    () => allItems.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [allItems, pageIndex, pageSize]
  )

  useToastOnError(isError, error)

  const handleOpenDetails = (auditLog: AuditLogDTO) => {
    setSelectedAuditLog(auditLog)
    setIsDrawerOpen(true)
  }

  // isLoading is only true before the very first batch has ever resolved —
  // there's nothing to show a shell for yet. Once that first batch has
  // landed, further page-to-page fetches (pageReady false) keep the table
  // shell (headers/toolbar/pager) mounted and show a loading state scoped to
  // just the row area instead of replacing the whole table.
  const isLoadingRows = !isLoading && !pageReady

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3 pt-4">
          {Array.from({ length: 8 }, (_, i) => `skeleton-row-${i}`).map((key) => (
            <Skeleton key={key} className="h-10 w-full rounded-md" />
          ))}
        </div>
      )
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-muted-foreground text-sm">Failed to load audit logs.</p>
          <Button variant="outline" onClick={() => void refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )
    }

    if (total === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <FolderOpen className="text-muted-foreground h-10 w-10" />
          <p className="text-lg font-semibold">No audit logs yet</p>
          <p className="text-muted-foreground text-sm">Actions will appear here once recorded.</p>
        </div>
      )
    }

    if (isMobile) {
      return (
        <MobileDatagrid
          auditLogs={pageItems}
          total={total}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={setPageIndex}
          isLoadingRows={isLoadingRows}
          search={searchInput}
          onSearchChange={setSearchInput}
          selectedFilters={filters}
          onApplyFilters={setFilters}
          selectedSortField={sortField}
          selectedSortDirection={sortDirection}
          onApplySort={(field, direction) => {
            setSortField(field)
            setSortDirection(direction)
          }}
          onClick={handleOpenDetails}
        />
      )
    }

    return (
      <DataTable
        columns={columns}
        data={pageItems}
        onRowClick={handleOpenDetails}
        total={total}
        pageIndex={pageIndex}
        pageSize={pageSize}
        pageCount={totalPages}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        isLoadingRows={isLoadingRows}
        search={searchInput}
        onSearchChange={setSearchInput}
        selectedFilters={filters}
        onApplyFilters={setFilters}
        selectedSortField={sortField}
        selectedSortDirection={sortDirection}
        onApplySort={(field, direction) => {
          setSortField(field)
          setSortDirection(direction)
        }}
      />
    )
  }

  return (
    <div className="flex w-full max-w-none flex-col">
      <PageHeader title="Audit Logs" />

      <div className="flex flex-col p-6 pb-0">
        <div className="mt-8 mb-10 h-full w-full rounded-lg">{renderContent()}</div>
      </div>

      <AuditLogDetailsDrawer
        auditLog={selectedAuditLog}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        isMobile={isMobile}
      />
    </div>
  )
}
