'use client'

import { ArrowDownUp, Search,SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'

import { PositionsTable } from '@/components/positions/positions-table'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Input } from '@/components/ui/input'

const MOCK_POSITIONS = [
  { id: '1', name: 'Editor-in-Chief', abbreviation: 'EIC', userCount: 1, createdOn: '01/01/26' },
  {
    id: '2',
    name: 'Managing Editor for Development',
    abbreviation: 'MED',
    userCount: 1,
    createdOn: '01/01/26',
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

export default function PositionsPage() {
  const [positions] = useState(MOCK_POSITIONS)
  const [search, setSearch] = useState('')

  // 🔍 filtering logic (core of this commit)
  const filteredPositions = useMemo(() => {
    const query = search.toLowerCase().trim()

    if (!query) {return positions}

    return positions.filter(
      (p) => p.name.toLowerCase().includes(query) || p.abbreviation.toLowerCase().includes(query)
    )
  }, [positions, search])

  return (
    <main className="bg-background flex min-h-screen flex-col">
      <div className="px-6 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>Positions</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-foreground text-2xl font-bold">Positions</h1>
        </div>

        {/* 🔍 Toolbar */}
        <div className="mb-6 flex items-center gap-3">
          {/* Search */}
          <div className="relative h-12 flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 h-6 w-4 w-6 -translate-y-1/2" />
            <Input
              placeholder="Search positions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-tc_grayscale-900 h-12 pl-11 text-base font-semibold"
            />
          </div>

          <button className="text-muted-foreground hover:text-foreground flex h-12 flex-col items-center justify-center gap-1 px-3 transition-colors">
            <SlidersHorizontal className="h-6 w-6" />
            <span className="text-sm leading-none font-bold">Filter</span>
          </button>

          <button className="text-muted-foreground hover:text-foreground flex h-12 flex-col items-center justify-center gap-1 px-3 transition-colors">
            <ArrowDownUp className="h-6 w-6" />
            <span className="text-sm leading-none font-bold">Sort</span>
          </button>
        </div>

        {/* Table */}
        <PositionsTable positions={filteredPositions} />
      </div>
    </main>
  )
}
