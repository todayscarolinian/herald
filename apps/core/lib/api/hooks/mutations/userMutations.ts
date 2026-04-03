import type { APIResponse, DeleteUserInput } from '@herald/types'
import { useMutation } from '@tanstack/react-query'

import { disableUser } from '@/lib/api/services/userService'

export function useDisableUser() {
  return useMutation<APIResponse<{ message: string }>, Error, DeleteUserInput>({
    mutationFn: disableUser,
  })
}
