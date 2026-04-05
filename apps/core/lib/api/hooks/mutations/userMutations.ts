import type { APIResponse, UpdateUserInput, UserDTO } from '@herald/types'
import { useMutation } from '@tanstack/react-query'

import { updateUser } from '@/lib/api/services/userService'

export function useUpdateUser() {
  return useMutation<APIResponse<UserDTO>, Error, UpdateUserInput>({
    mutationFn: updateUser,
  })
}
