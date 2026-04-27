'use client'

import {
  PermissionDTO,
  PermissionFilters,
  PermissionListDTO,
  PermissionSortField,
} from '@herald/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

import { PermissionCard } from './permission-card'
import { PermissionMobileToolbar } from './permission-mobile-toolbar'

const MOBILE_PAGE_SIZE = 10
const PERMISSION_SORT_FIELDS: PermissionSortField[] = ['name', 'domain', 'createdAt', 'updatedAt']

type PermissionMobileDatagridProps = {
  permissions: PermissionListDTO
  onClick: (permission: PermissionDTO) => void
}

export function PermissionMobileDatagrid({ permissions, onClick }: PermissionMobileDatagridProps) {
  const [search, setSearch] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<PermissionFilters>({})
  const [selectedSortField, setSelectedSortField] = useState<PermissionSortField>('name')
  const [selectedSortDirection, setSelectedSortDirection] = useState<'asc' | 'desc'>('asc')
  const [mobilePage, setMobilePage] = useState(0)

  const processedPermissions = useMemo(() => {
    const loweredSearch = search.trim().toLowerCase()

    const filtered = permissions.items.filter((permission) => {
      if (loweredSearch) {
        const matchesSearch =
          permission.name.toLowerCase().includes(loweredSearch) ||
          permission.domain.toLowerCase().includes(loweredSearch) ||
          permission.description.toLowerCase().includes(loweredSearch)

        if (!matchesSearch) {
          return false
        }
      }

      if (selectedFilters.domain && permission.domain !== selectedFilters.domain) {
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
  }, [permissions.items, search, selectedFilters, selectedSortDirection, selectedSortField])

  const mobileTotalPages = useMemo(
    () => Math.max(1, Math.ceil(processedPermissions.length / MOBILE_PAGE_SIZE)),
    [processedPermissions.length]
  )

  const maxMobilePage = mobileTotalPages - 1
  const mobileCurrentPage = Math.min(mobilePage, maxMobilePage)

  const mobilePaginated = useMemo(() => {
    const start = mobileCurrentPage * MOBILE_PAGE_SIZE
    return processedPermissions.slice(start, start + MOBILE_PAGE_SIZE)
  }, [mobileCurrentPage, processedPermissions])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setMobilePage(0)
  }

  const applyFilters = (filters: PermissionFilters) => {
    setSelectedFilters(filters)
    setMobilePage(0)
  }

  const applySort = (field: PermissionSortField, direction: 'asc' | 'desc') => {
    setSelectedSortField(field)
    setSelectedSortDirection(direction)
    setMobilePage(0)
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-0 py-3 sm:grid-cols-2">
        {mobilePaginated.map((permission) => (
          <PermissionCard
            key={permission.id}
            permission={permission}
            onClick={() => onClick(permission)}
          />
        ))}
      </div>

      <div className="mt-4 mb-12 flex items-center justify-between px-0 py-3">
        <button
          onClick={() => setMobilePage(Math.max(mobileCurrentPage - 1, 0))}
          disabled={mobileCurrentPage === 0}
          className="flex h-6 w-6 items-center justify-center text-black/60 disabled:opacity-30"
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-6 w-6 text-black/60" strokeWidth={1.5} />
        </button>

        <div className="text-sm text-black">
          {processedPermissions.length === 0
            ? '0 of 0'
            : `${mobileCurrentPage * MOBILE_PAGE_SIZE + 1}-${Math.min(
                (mobileCurrentPage + 1) * MOBILE_PAGE_SIZE,
                processedPermissions.length
              )} of ${processedPermissions.length}`}
        </div>

        <button
          onClick={() => setMobilePage(Math.min(mobileCurrentPage + 1, maxMobilePage))}
          disabled={mobileCurrentPage >= maxMobilePage}
          className="flex h-6 w-6 items-center justify-center text-black/60 disabled:opacity-30"
          aria-label="Next Page"
        >
          <ChevronRight className="h-6 w-6 text-black/60" strokeWidth={1.5} />
        </button>
      </div>

      <PermissionMobileToolbar
        title="Permissions"
        search={search}
        onSearchChange={handleSearchChange}
        selectedFilters={selectedFilters}
        availableSortFields={PERMISSION_SORT_FIELDS}
        selectedSortField={selectedSortField}
        selectedSortDirection={selectedSortDirection}
        onApplyFilters={applyFilters}
        onApplySort={applySort}
      />
    </>
  )
}
