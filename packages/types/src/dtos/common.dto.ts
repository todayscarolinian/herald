/**
 * Common DTOs used across multiple modules in the application.
 *
 * This file includes generic input and output structures that can be reused in various contexts, such as pagination, sorting, and filtering.
 *
 * The purpose of these DTOs is to provide a consistent and standardized way of handling data transfer across different parts of the application, ensuring that the data being transferred adheres to the expected structure and format.
 */

export interface PaginationInput {
  page: number
  limit: number
}

export const DEFAULT_PAGINATION: PaginationInput = {
  page: 1,
  limit: 20,
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type SortDirection = 'asc' | 'desc'

export interface SortInput<T extends string = string> {
  field: T
  direction: SortDirection
}

export interface BatchOperationResult<T> {
  successful: T[]
  failed: Array<{
    item: T
    error: string
  }>
  totalProcessed: number
  successCount: number
  failureCount: number
}
