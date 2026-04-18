'use client'

import { ArrowDownUp, Search, SlidersHorizontal } from 'lucide-react'

import { Input } from '@/components/ui/input'

type Props = {
  search: string
  onSearchChange: (value: string) => void
  onFilterClick?: () => void
  onSortClick?: () => void
}

export function DesktopToolbar({ search, onSearchChange, onFilterClick, onSortClick }: Props) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="relative h-12 flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

        <Input
          placeholder="Search positions..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-tc_grayscale-900 h-12 pl-10 text-base font-medium placeholder:text-base"
        />
      </div>

      <button
        onClick={onFilterClick}
        className="text-muted-foreground hover:text-foreground flex h-12 flex-col items-center justify-center gap-1 px-3 transition-colors"
      >
        <SlidersHorizontal className="h-6 w-6" />
        <span className="text-sm font-bold">Filter</span>
      </button>

      <button
        onClick={onSortClick}
        className="text-muted-foreground hover:text-foreground flex h-12 flex-col items-center justify-center gap-1 px-3 transition-colors"
      >
        <ArrowDownUp className="h-6 w-6" />
        <span className="text-sm font-bold">Sort</span>
      </button>
    </div>
  )
}
