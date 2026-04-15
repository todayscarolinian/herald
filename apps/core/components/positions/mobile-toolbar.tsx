'use client'

import { ArrowDownUp,Search, SlidersHorizontal } from 'lucide-react'

type Props = {
  search: string
  onSearchChange: (value: string) => void
  onFilterClick?: () => void
  onSortClick?: () => void
}

export function MobileToolbar({ search, onSearchChange, onFilterClick, onSortClick }: Props) {
  return (
    <div className="bg-background fixed right-0 bottom-0 left-0 flex items-center gap-2 border-t px-2 py-4 shadow-[0_-2px_4px_0_rgba(0,0,0,0.1)]">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search positions..."
          className="border-tc_grayscale-900 bg-background w-full rounded-sm border py-2 pr-4 pl-10 text-sm outline-none placeholder:text-xs placeholder:font-semibold"
        />
      </div>

      <button
        onClick={onFilterClick}
        className="bg-background flex h-10 w-10 items-center justify-center rounded-lg border border-black/40"
      >
        <SlidersHorizontal size={16} />
      </button>

      <button
        onClick={onSortClick}
        className="bg-background flex h-10 w-10 items-center justify-center rounded-lg border border-black/40"
      >
        <ArrowDownUp size={16} />
      </button>
    </div>
  )
}
