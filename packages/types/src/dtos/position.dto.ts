/**
 * Position-related data transfer objects (DTOs) and interfaces.
 *
 * This file defines the structure of position-related data that is transferred between different layers of the application.
 * It includes input DTOs for creating, updating, and deleting positions, as well as output DTOs for position data.
 */

import type { UUID } from '../shared/uid.ts'
import type { Position } from '../user/index.ts'
import type { PaginatedResult, PaginationInput, SortInput } from './common.dto.ts'

// =============================================================================
// INPUT DTOs
// =============================================================================

export interface CreatePositionInput {
  name: string
  abbreviation: string
  permissions: string[]
}

export interface UpdatePositionInput {
  id: UUID
  name?: string
  abbreviation?: string
  permissions?: string[]
}

export interface DeletePositionInput {
  id: UUID
}

export interface ListPositionInput {
  filters?: PositionFilters
  pagination: PaginationInput
  sort?: SortInput<PositionSortField>
}

export interface PositionFilters {
  permissions?: string[]
}

export type PositionSortField = 'name' | 'createdAt' | 'updatedAt'

// =============================================================================
// OUTPUT DTOs
// =============================================================================

export type PositionDTO = Position

export type PositionListDTO = PaginatedResult<PositionDTO>
