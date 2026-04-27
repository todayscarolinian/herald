import type {
  APIResponse,
  CreatePositionInput,
  DeletePositionInput,
  PositionDTO,
  UpdatePositionInput,
} from '@herald/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createPosition, deletePosition, updatePosition } from '@/lib/api/services/positionService'

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
