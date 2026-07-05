import type { Domain, Position } from '@herald/types'

export function resolveDomainsForPositions(positions: Position[]): Domain[] {
  return [...new Set(positions.flatMap((position) => position.domains))]
}
