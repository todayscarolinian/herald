import type { APIResponse, CreateUserInput, UserDTO } from '@herald/types'

export interface CreateUserParams extends CreateUserInput {
  password: string
}

export async function createUser(params: CreateUserParams): Promise<UserDTO> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  const data = (await res.json()) as APIResponse<UserDTO>

  if (!res.ok || !data.success) {
    throw new Error(data?.error?.message ?? `Request failed: ${res.status} ${res.statusText}`)
  }

  if (!data.data) {
    throw new Error('No user data returned from server')
  }

  return data.data
}
