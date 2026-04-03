import type { APIResponse, UpdateUserInput, UserDTO } from '@herald/types'

import { put } from '@/lib/api/client'

export async function updateUser(params: UpdateUserInput): Promise<APIResponse<UserDTO>> {
  return put<APIResponse<UserDTO>, UpdateUserInput>(`/api/users/${params.id}`, params)
}
