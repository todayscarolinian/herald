'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { DesktopToolbar } from '@/components/positions/desktop-toolbar'
import { MobileToolbar } from '@/components/positions/mobile-toolbar'
import { PositionCard } from '@/components/positions/position-card'
import { PositionDetailsDrawer } from '@/components/positions/position-details-drawer'
import { PositionsTable } from '@/components/positions/positions-table'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const MOCK_POSITIONS = [
  {
    id: '1',
    name: 'Editor-in-Chief',
    abbreviation: 'EIC',
    userCount: 1,
    createdOn: '01/01/26',
    permissions: ['CREATE_ARTICLE', 'PUBLISH_ARTICLE', 'MANAGE_USERS'],
  },
  {
    id: '2',
    name: 'Managing Editor for Development',
    abbreviation: 'MED',
    userCount: 1,
    createdOn: '01/01/26',
    permissions: ['EDIT_ARTICLE'],
  },
  {
    id: '3',
    name: 'Managing Editor for Administration',
    abbreviation: 'MEA',
    userCount: 1,
    createdOn: '01/01/26',
  },
  { id: '4', name: 'Writer', abbreviation: 'WR', userCount: 12, createdOn: '01/01/26' },
  { id: '5', name: 'Researcher', abbreviation: 'RES', userCount: 13, createdOn: '01/01/26' },
  { id: '6', name: 'Web Developer', abbreviation: 'WEB', userCount: 16, createdOn: '01/01/26' },
  { id: '7', name: 'Visual Designer', abbreviation: 'VD', userCount: 20, createdOn: '01/01/26' },
  {
    id: '8',
    name: 'Associate Editor-in-Chief',
    abbreviation: 'AEIC',
    userCount: 1,
    createdOn: '01/01/26',
  },
  { id: '9', name: 'Copy Editor', abbreviation: 'CE', userCount: 5, createdOn: '01/01/26' },
  {
    id: '10',
    name: 'Social Media Manager',
    abbreviation: 'SMM',
    userCount: 3,
    createdOn: '01/01/26',
  },
  { id: '11', name: 'Photographer', abbreviation: 'PHO', userCount: 8, createdOn: '01/01/26' },
  { id: '12', name: 'Videographer', abbreviation: 'VID', userCount: 4, createdOn: '01/01/26' },
]

type Position = {
  id: string
  name: string
  abbreviation: string
  userCount: number
  createdOn: string
  permissions?: string[]
}

export default function PositionsPage() {
  const [positions] = useState(MOCK_POSITIONS)
  const [search, setSearch] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // MOBILE PAGINATION STATE
  const MOBILE_PAGE_SIZE = 10
  const [mobilePage, setMobilePage] = useState(0)

  useEffect(() => {
    const check = () => {
      const width = window.innerWidth
      setIsMobile(width <= 470)
      setIsTablet(width > 470 && width < 1024)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // reset mobile page on search change
  useEffect(() => {
    setMobilePage(0)
  }, [search])

  const filteredPositions = useMemo(() => {
    const query = search.toLowerCase().trim()

    if (!query) {return positions}

    return positions.filter(
      (p) => p.name.toLowerCase().includes(query) || p.abbreviation.toLowerCase().includes(query)
    )
  }, [positions, search])

  // MOBILE PAGINATION DATA
  const mobileTotalPages = Math.ceil(filteredPositions.length / MOBILE_PAGE_SIZE)

  const mobilePaginated = useMemo(() => {
    const start = mobilePage * MOBILE_PAGE_SIZE
    return filteredPositions.slice(start, start + MOBILE_PAGE_SIZE)
  }, [filteredPositions, mobilePage])

  const handleOpenDetails = (position: Position) => {
    setSelectedPosition(position)
    setIsDrawerOpen(true)
  }

  return (
    <main className="font-roboto flex min-h-screen flex-col !bg-[#f9fafb]">
      <div className="px-6 py-4">
        {!isMobile && !isTablet && (
          <Breadcrumb>
            <BreadcrumbList className="text-base">
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage>Positions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      <div className="flex-1 px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-foreground font-roboto-condensed text-2xl font-bold">Positions</h1>
        </div>

        {!isMobile && (
          <DesktopToolbar
            search={search}
            onSearchChange={setSearch}
            onFilterClick={() => {}}
            onSortClick={() => {}}
          />
        )}

        {isMobile ? (
          <>
            <div>
              {mobilePaginated.map((p) => (
                <PositionCard key={p.id} position={p} onClick={() => handleOpenDetails(p)} />
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
                {filteredPositions.length === 0
                  ? '0 of 0'
                  : `${mobilePage * MOBILE_PAGE_SIZE + 1}–${Math.min(
                      (mobilePage + 1) * MOBILE_PAGE_SIZE,
                      filteredPositions.length
                    )} of ${filteredPositions.length}`}
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
              search={search}
              onSearchChange={setSearch}
              onFilterClick={() => {}}
              onSortClick={() => {}}
            />
          </>
        ) : (
          <PositionsTable positions={filteredPositions} onRowClick={handleOpenDetails} />
        )}
      </div>

      <PositionDetailsDrawer
        position={selectedPosition}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        isMobile={isMobile}
      />
    </main>
  )
}
