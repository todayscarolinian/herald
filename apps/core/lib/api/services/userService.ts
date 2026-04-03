import type { APIResponse, DeleteUserInput } from '@herald/types'

export async function deleteUser(
  params: DeleteUserInput
): Promise<APIResponse<{ message: string }>> {
  const res = await fetch(`/api/users/${params.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  const data = (await res.json()) as APIResponse<{ message: string }>

  if (!res.ok) {
    throw new Error(data.error?.message ?? `Failed to delete user: ${res.status} ${res.statusText}`)
  }

  return data
}
