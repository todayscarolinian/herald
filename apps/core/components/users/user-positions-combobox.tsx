'use client'

import type { UUID } from '@herald/types'
import * as React from 'react'

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox'

type PositionOption = {
  id: UUID
  label: string
}

const defaultOptions: PositionOption[] = [
  { id: 'cto', label: 'CTO' },
  { id: 'wr', label: 'WR' },
  { id: 'ome', label: 'OME' },
  { id: 'vd', label: 'VD' },
  { id: 'res', label: 'RES' },
]

type PositionsComboboxProps = {
  options?: PositionOption[]
  value?: UUID[]
  defaultValue?: UUID[]
  onValueChange?: (value: UUID[]) => void
}

export function PositionsCombobox({
  options = defaultOptions,
  value,
  defaultValue,
  onValueChange,
}: PositionsComboboxProps = {}) {
  const anchor = useComboboxAnchor()
  const ids = options.map((option) => option.id)
  const labelById = new Map(options.map((option) => [option.id, option.label]))

  const fallbackDefaultValue = defaultValue ?? (ids[0] ? [ids[0]] : [])

  return (
    <Combobox
      multiple
      autoHighlight
      items={ids}
      value={value}
      defaultValue={fallbackDefaultValue}
      onValueChange={(nextValues) => onValueChange?.(nextValues as UUID[])}
    >
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(values) => (
            <React.Fragment>
              {values.map((currentId: string) => (
                <ComboboxChip
                  key={currentId}
                  className="bg-tc_primary-500 border-tc_primary-500 text-white"
                >
                  {labelById.get(currentId as UUID) ?? currentId}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(itemId) => (
            <ComboboxItem key={itemId} value={itemId}>
              {labelById.get(itemId as UUID) ?? itemId}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
