/**
 * This file contains utility functions for creating paginated results and batch operation results.
 */

import { BatchOperationResult, PaginatedResult, PaginationInput } from '@herald/types'

export function createPaginatedResult<T>(
  items: T[],
  total: number,
  pagination: PaginationInput
): PaginatedResult<T> {
  if (!Number.isInteger(pagination.page) || pagination.page < 1) {
    throw new Error('pagination.page must be an integer greater than 0')
  }

  if (!Number.isInteger(pagination.limit) || pagination.limit <= 0) {
    throw new Error('pagination.limit must be an integer greater than 0')
  }

  if (!Number.isInteger(total) || total < 0) {
    throw new Error('total must be a non-negative integer')
  }

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
