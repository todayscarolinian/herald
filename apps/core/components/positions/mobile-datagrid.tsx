'use client'

import { PositionDTO, PositionListDTO } from '@herald/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

import { MobileToolbar } from '../shared/MobileToolbar'
import { PositionCard } from './position-card'

const MOBILE_PAGE_SIZE = 10

type MobileDatagridProps = {
  positions: PositionListDTO
  onClick: (position: PositionDTO) => void
}

export default function MobileDatagrid({ positions, onClick }: MobileDatagridProps) {
  const [filteredPositions, setFilteredPositions] = useState(positions.items)
  const [search, setSearch] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [selectedSortField, setSelectedSortField] = useState<string>('name')
  const [selectedSortDirection, setSelectedSortDirection] = useState<'asc' | 'desc'>('asc')
  const [mobilePage, setMobilePage] = useState(0)
  const mobileTotalPages = useMemo(() => Math.ceil(positions.total / MOBILE_PAGE_SIZE), [positions])

  const mobilePaginated = useMemo(() => {
    const start = mobilePage * MOBILE_PAGE_SIZE
    return filteredPositions.slice(start, start + MOBILE_PAGE_SIZE)
  }, [filteredPositions, mobilePage])

  const availableFilters = [
    'CREATE_ARTICLE',
    'EDIT_ARTICLE',
    'DELETE_ARTICLE',
    'PUBLISH_ARTICLE',
    'MANAGE_USERS',
  ]

  const availableSortFields = ['name', 'createdAt', 'userCount']

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setMobilePage(0)

    const lowercased = val.toLowerCase()
    const filtered = positions.items.filter(
      (position) =>
        position.name.toLowerCase().includes(lowercased) ||
        position.abbreviation.toLowerCase().includes(lowercased)
    )
    setFilteredPositions(filtered)
  }

  const applyFilters = (filters: string[]) => {
    setSelectedFilters(filters)
    setMobilePage(0)

    if (filters.length === 0) {
      setFilteredPositions(positions.items)
      return
    }

    const filtered = positions.items.filter((position) =>
      filters.some((filter) => position.permissions.includes(filter))
    )
    setFilteredPositions(filtered)
  }

  const applySort = (field: string, direction: 'asc' | 'desc') => {
    setSelectedSortField(field)
    setSelectedSortDirection(direction)
    setMobilePage(0)

    const sorted = [...filteredPositions].sort((a, b) => {
      const aValue = a[field as keyof PositionDTO]
      const bValue = b[field as keyof PositionDTO]

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1
      }
      return 0
    })
    setFilteredPositions(sorted)
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-0 py-3 sm:grid-cols-2">
        {mobilePaginated.map((p) => (
          <PositionCard key={p.id} position={p} onClick={() => onClick(p)} />
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
          {positions.total === 0
            ? '0 of 0'
            : `${mobilePage * MOBILE_PAGE_SIZE + 1}-${Math.min(
                (mobilePage + 1) * MOBILE_PAGE_SIZE,
                positions.total
              )} of ${positions.total}`}
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
        title="Positions"
        search={search}
        onSearchChange={handleSearchChange}
        availableFilters={availableFilters}
        selectedFilters={selectedFilters}
        availableSortFields={availableSortFields}
        selectedSortField={selectedSortField}
        selectedSortDirection={selectedSortDirection}
        onApplyFilters={applyFilters}
        onApplySort={applySort}
      />
    </>
  )
}
