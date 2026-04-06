import type { APIResponse, CreateUserInput, UpdateUserInput, UserDTO } from '@herald/types'
import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'

import { updateUser } from '@/lib/api/services/userService'
import { createUser } from '@/lib/api/services/userService'

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
