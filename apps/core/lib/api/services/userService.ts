import type { APIResponse, DeleteUserInput } from '@herald/types'

import { post } from '@/lib/api/client'

export async function disableUser(
  params: DeleteUserInput
): Promise<APIResponse<{ message: string }>> {
  return post<APIResponse<{ message: string }>, DeleteUserInput>(`/api/users/${params.id}`, params)
}
