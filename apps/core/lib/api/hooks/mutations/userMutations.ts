import type { APIResponse, DeleteUserInput, UpdateUserInput, UserDTO } from '@herald/types'
import { useMutation } from '@tanstack/react-query'

import { disableUser, updateUser } from '@/lib/api/services/userService'

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
