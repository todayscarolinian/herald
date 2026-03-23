import type { APIResponse, ResetPasswordRequest } from '@herald/types'
import { useMutation } from '@tanstack/react-query'

import { resetPassword } from '../../services/authService'

export function useResetPassword() {
  return useMutation<APIResponse<{ message: string }>, Error, ResetPasswordRequest>({
    mutationFn: resetPassword,
  })
}

