import type { APIResponse, DeleteUserInput, UpdateUserInput, UserDTO } from '@herald/types'

export async function updateUser(params: UpdateUserInput): Promise<APIResponse<UserDTO>> {
  const res = await fetch(`/api/users/${params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  const data = (await res.json()) as APIResponse<UserDTO>

  if (!res.ok) {
    throw new Error(data.error?.message ?? `Failed to update user: ${res.status} ${res.statusText}`)
  }

  return data
}

export async function disableUser(
  params: DeleteUserInput
): Promise<APIResponse<{ message: string }>> {
  const res = await fetch(`/api/users/${params.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  const data = (await res.json()) as APIResponse<{ message: string }>

  if (!res.ok) {
    throw new Error(
      data.error?.message ?? `Failed to disable user: ${res.status} ${res.statusText}`
    )
  }

  return data
}
