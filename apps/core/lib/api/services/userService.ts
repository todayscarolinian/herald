import type { APIResponse, DeleteUserInput } from '@herald/types'

import { del } from '@/lib/api/client'

export async function deleteUser(
  params: DeleteUserInput
): Promise<APIResponse<{ message: string }>> {
  return del<APIResponse<{ message: string }>>(`/api/users/${params.id}`)
}
