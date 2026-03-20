/**
 * This file contains utility functions for creating paginated results and batch operation results.
 */

import { BatchOperationResult, PaginatedResult, PaginationInput } from '@herald/types'

export function createPaginatedResult<T>(
  items: T[],
  total: number,
  pagination: PaginationInput
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / pagination.limit)
  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages,
    hasNextPage: pagination.page < totalPages,
    hasPreviousPage: pagination.page > 1,
  }
}

export function createBatchResult<T>(
  successful: T[],
  failed: Array<{ item: T; error: string }>
): BatchOperationResult<T> {
  return {
    successful,
    failed,
    totalProcessed: successful.length + failed.length,
    successCount: successful.length,
    failureCount: failed.length,
  }
}
