import type {
  APIResponse,
  CreateUserInput,
  DeleteUserInput,
  UpdateUserInput,
  UserDTO,
} from '@herald/types'
import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'

import { createUser, deleteUser, disableUser, updateUser } from '@/lib/api/services/userService'

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation<APIResponse<UserDTO>, Error, CreateUserInput>({
    mutationFn: createUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser() {
  return useMutation<APIResponse<UserDTO>, Error, UpdateUserInput>({
    mutationFn: updateUser,
  })
}

export function useDisableUser() {
  return useMutation<APIResponse<{ message: string }>, Error, DeleteUserInput>({
    mutationFn: disableUser,
  })
}

export function useDeleteUser() {
  return useMutation<APIResponse<{ message: string }>, Error, DeleteUserInput>({
    mutationFn: deleteUser,
  })
}
