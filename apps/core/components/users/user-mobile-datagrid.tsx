'use client'

import { UserDTO, UserFilters, UserListDTO, UserSortField } from '@herald/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

import { UserCard } from './user-card'
import { MobileToolbar } from './user-mobile-toolbar'

const MOBILE_PAGE_SIZE = 10
const USER_SORT_FIELDS: UserSortField[] = [
  'firstName',
  'lastName',
  'email',
  'createdAt',
  'updatedAt',
]

type MobileDatagridProps = {
  users: UserListDTO
  onClick: (user: UserDTO) => void
}

export default function MobileDatagrid({ users, onClick }: MobileDatagridProps) {
  const [search, setSearch] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<UserFilters>({})
  const [selectedSortField, setSelectedSortField] = useState<UserSortField>('firstName')
  const [selectedSortDirection, setSelectedSortDirection] = useState<'asc' | 'desc'>('asc')
  const [mobilePage, setMobilePage] = useState(0)
  const availablePositions = useMemo(() => {
    const seen = new Set<string>()

    return users.items.flatMap((user) =>
      user.positions
        .filter((position) => {
          if (seen.has(position.id)) {
            return false
          }

          seen.add(position.id)
          return true
        })
        .map((position) => ({
          id: position.id,
          label: position.abbreviation || position.name,
        }))
    )
  }, [users.items])

  const processedUsers = useMemo(() => {
    const loweredSearch = search.trim().toLowerCase()

    const filtered = users.items.filter((user) => {
      if (loweredSearch) {
        const matchesSearch =
          user.firstName.toLowerCase().includes(loweredSearch) ||
          (user.middleName && user.middleName.toLowerCase().includes(loweredSearch)) ||
          user.lastName.toLowerCase().includes(loweredSearch) ||
          user.email.toLowerCase().includes(loweredSearch)

        if (!matchesSearch) {
          return false
        }
      }

      if (
        selectedFilters.positionIds?.length &&
        !user.positions.some((position) => selectedFilters.positionIds?.includes(position.id))
      ) {
        return false
      }

      if (selectedFilters.disabled !== undefined && user.disabled !== selectedFilters.disabled) {
        return false
      }

      if (
        selectedFilters.emailVerified !== undefined &&
        user.emailVerified !== selectedFilters.emailVerified
      ) {
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
  }, [search, selectedFilters, selectedSortDirection, selectedSortField, users.items])

  const mobileTotalPages = useMemo(
    () => Math.max(1, Math.ceil(processedUsers.length / MOBILE_PAGE_SIZE)),
    [processedUsers.length]
  )

  const mobilePaginated = useMemo(() => {
    const start = mobilePage * MOBILE_PAGE_SIZE
    return processedUsers.slice(start, start + MOBILE_PAGE_SIZE)
  }, [mobilePage, processedUsers])

  if (mobilePage > mobileTotalPages - 1) {
    setMobilePage(Math.max(0, mobileTotalPages - 1))
  }

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setMobilePage(0)
  }

  const applyFilters = (filters: UserFilters) => {
    setSelectedFilters(filters)
    setMobilePage(0)
  }

  const applySort = (field: UserSortField, direction: 'asc' | 'desc') => {
    setSelectedSortField(field)
    setSelectedSortDirection(direction)
    setMobilePage(0)
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-0 py-3 sm:grid-cols-2">
        {mobilePaginated.map((u) => (
          <UserCard key={u.id} user={u} onClick={() => onClick(u)} />
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
          {processedUsers.length === 0
            ? '0 of 0'
            : `${mobilePage * MOBILE_PAGE_SIZE + 1}-${Math.min(
                (mobilePage + 1) * MOBILE_PAGE_SIZE,
                processedUsers.length
              )} of ${processedUsers.length}`}
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
        title="Users"
        search={search}
        onSearchChange={handleSearchChange}
        availablePositions={availablePositions}
        selectedFilters={selectedFilters}
        availableSortFields={USER_SORT_FIELDS}
        selectedSortField={selectedSortField}
        selectedSortDirection={selectedSortDirection}
        onApplyFilters={applyFilters}
        onApplySort={applySort}
      />
    </>
  )
}
