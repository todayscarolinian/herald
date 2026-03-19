/**
 * Common DTOs used across multiple modules in the application. 
 * 
 * This file includes generic input and output structures that can be reused in various contexts, such as pagination, sorting, and filtering.
 * 
 * The purpose of these DTOs is to provide a consistent and standardized way of handling data transfer across different parts of the application, ensuring that the data being transferred adheres to the expected structure and format.
 */

export interface PaginationInput {
  page: number;
  limit: number;
}

export const DEFAULT_PAGINATION: PaginationInput = {
  page: 1,
  limit: 20,
};

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function createPaginatedResult<T>(
  items: T[],
  total: number,
  pagination: PaginationInput,
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / pagination.limit);
  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages,
    hasNextPage: pagination.page < totalPages,
    hasPreviousPage: pagination.page > 1,
  };
}

export type SortDirection = "asc" | "desc";

export interface SortInput<T extends string = string> {
  field: T;
  direction: SortDirection;
}

export interface BatchOperationResult<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

export function createBatchResult<T>(
  successful: T[],
  failed: Array<{ item: T; error: string }>,
): BatchOperationResult<T> {
  return {
    successful,
    failed,
    totalProcessed: successful.length + failed.length,
    successCount: successful.length,
    failureCount: failed.length,
  };
}