'use client'

import { AuditLogDTO, AuditLogFilters, AuditLogListDTO, AuditLogSortField } from '@herald/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

import { AuditLogCard } from './audit-log-card'
import { MobileToolbar } from './audit-log-mobile-toolbar'

const MOBILE_PAGE_SIZE = 10
const AUDIT_LOG_SORT_FIELDS: AuditLogSortField[] = ['action', 'timestamp']

type MobileDatagridProps = {
  auditLogs: AuditLogListDTO
  onClick: (auditLog: AuditLogDTO) => void
}

export function MobileDatagrid({ auditLogs, onClick }: MobileDatagridProps) {
  const [search, setSearch] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<AuditLogFilters>({})
  const [selectedSortField, setSelectedSortField] = useState<AuditLogSortField>('action')
  const [selectedSortDirection, setSelectedSortDirection] = useState<'asc' | 'desc'>('asc')
  const [mobilePage, setMobilePage] = useState(0)

  const processedAuditLogs = useMemo(() => {
    const loweredSearch = search.trim().toLowerCase()

    const filtered = auditLogs.items.filter((auditLog) => {
      if (loweredSearch) {
        const matchesSearch =
          auditLog.action.toLowerCase().includes(loweredSearch) ||
          auditLog.timestamp.toLowerCase().includes(loweredSearch)

        if (!matchesSearch) {
          return false
        }
      }

      if (selectedFilters.action && auditLog.action !== selectedFilters.action) {
        return false
      }

      return true
    })

    return filtered.sort((a, b) => {
      const aValue = a[selectedSortField]
      const bValue = b[selectedSortField]

      if (aValue < bValue) {
        return selectedSortDirection === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return selectedSortDirection === 'asc' ? 1 : -1
      }

      return 0
    })
  }, [search, selectedFilters, selectedSortDirection, selectedSortField, auditLogs.items])

  const mobileTotalPages = useMemo(
    () => Math.max(1, Math.ceil(processedAuditLogs.length / MOBILE_PAGE_SIZE)),
    [processedAuditLogs.length]
  )

  const mobilePaginated = useMemo(() => {
    const start = mobilePage * MOBILE_PAGE_SIZE
    return processedAuditLogs.slice(start, start + MOBILE_PAGE_SIZE)
  }, [mobilePage, processedAuditLogs])

  if (mobilePage > mobileTotalPages - 1) {
    setMobilePage(Math.max(0, mobileTotalPages - 1))
  }

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setMobilePage(0)
  }

  const applyFilters = (filters: AuditLogFilters) => {
    setSelectedFilters(filters)
    setMobilePage(0)
  }

  const applySort = (field: AuditLogSortField, direction: 'asc' | 'desc') => {
    setSelectedSortField(field)
    setSelectedSortDirection(direction)
    setMobilePage(0)
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-0 py-3 sm:grid-cols-2">
        {mobilePaginated.map((u) => (
          <AuditLogCard key={u.id} auditLog={u} onClick={() => onClick(u)} />
        ))}
      </div>

      <div className="mt-4 mb-12 flex items-center justify-between px-0 py-3">
        <button
          onClick={() => setMobilePage((p) => Math.max(p - 1, 0))}
          disabled={mobilePage === 0}
          className="flex h-6 w-6 items-center justify-center text-black/60 disabled:opacity-30"
        >
          <ChevronLeft className="h-6 w-6 text-black/60" strokeWidth={1.5} />
        </button>

        <div className="text-sm text-black">
          {processedAuditLogs.length === 0
            ? '0 of 0'
            : `${mobilePage * MOBILE_PAGE_SIZE + 1}-${Math.min(
                (mobilePage + 1) * MOBILE_PAGE_SIZE,
                processedAuditLogs.length
              )} of ${processedAuditLogs.length}`}
        </div>

        <button
          onClick={() => setMobilePage((p) => Math.min(p + 1, mobileTotalPages - 1))}
          disabled={mobilePage >= mobileTotalPages - 1}
          className="flex h-6 w-6 items-center justify-center text-black/60 disabled:opacity-30"
        >
          <ChevronRight className="h-6 w-6 text-black/60" strokeWidth={1.5} />
        </button>
      </div>

      <MobileToolbar
        title="Audit Logs"
        search={search}
        onSearchChange={handleSearchChange}
        selectedFilters={selectedFilters}
        availableSortFields={AUDIT_LOG_SORT_FIELDS}
        selectedSortField={selectedSortField}
        selectedSortDirection={selectedSortDirection}
        onApplyFilters={applyFilters}
        onApplySort={applySort}
      />
    </>
  )
}
