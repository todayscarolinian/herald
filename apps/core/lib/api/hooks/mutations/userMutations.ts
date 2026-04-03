import type { APIResponse, DeleteUserInput } from '@herald/types'
import { useMutation } from '@tanstack/react-query'

import { deleteUser } from '@/lib/api/services/userService'

export function useDeleteUser() {
  return useMutation<APIResponse<{ message: string }>, Error, DeleteUserInput>({
    mutationFn: deleteUser,
  })
}
