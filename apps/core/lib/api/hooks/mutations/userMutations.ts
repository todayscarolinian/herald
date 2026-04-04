import type { UserDTO } from '@herald/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createUser, type CreateUserParams } from '@/lib/api/services/userService'

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation<UserDTO, Error, CreateUserParams>({
    mutationFn: createUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
