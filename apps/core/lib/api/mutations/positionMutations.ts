import type {
  APIResponse,
  BulkCreatePositionRowInput,
  BulkPositionResult,
  BulkUpdatePositionRowInput,
  CreatePositionInput,
  DeletePositionInput,
  PositionDTO,
  UpdatePositionInput,
} from '@herald/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  bulkCreatePositions,
  bulkUpdatePositions,
  createPosition,
  deletePosition,
  updatePosition,
} from '@/lib/api/services/positionService'

export function useCreatePosition() {
  const queryClient = useQueryClient()

  return useMutation<APIResponse<PositionDTO>, Error, CreatePositionInput>({
    mutationFn: createPosition,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['positions'] })
    },
  })
}

export function useUpdatePosition() {
  const queryClient = useQueryClient()

  return useMutation<APIResponse<PositionDTO>, Error, UpdatePositionInput>({
    mutationFn: updatePosition,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['positions'] })
    },
  })
}

export function useDeletePosition() {
  const queryClient = useQueryClient()

  return useMutation<APIResponse<{ message: string }>, Error, DeletePositionInput>({
    mutationFn: deletePosition,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['positions'] })
    },
  })
}

export function useBulkCreatePositions() {
  const queryClient = useQueryClient()

  return useMutation<
    APIResponse<BulkPositionResult>,
    Error,
    { positions: BulkCreatePositionRowInput[] }
  >({
    mutationFn: bulkCreatePositions,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['positions'] })
    },
  })
}

export function useBulkUpdatePositions() {
  const queryClient = useQueryClient()

  return useMutation<
    APIResponse<BulkPositionResult>,
    Error,
    { positions: BulkUpdatePositionRowInput[] }
  >({
    mutationFn: bulkUpdatePositions,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['positions'] })
    },
  })
}
