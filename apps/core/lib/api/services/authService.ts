import type { APIResponse, ResetPasswordRequest } from '@herald/types'

import { post } from '../client'
import { ENDPOINTS } from '../endpoints'

export function resetPassword(request: ResetPasswordRequest): Promise<APIResponse<{ message: string }>> {
  // Backend expects: { token, newPassword }
  return post<APIResponse<{ message: string }>>(ENDPOINTS.auth.resetPassword, request)
}

