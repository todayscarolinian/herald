import type {
  APIResponse,
  CreateUserInput,
  DeleteUserInput,
  ListUsersInput,
  PaginatedResult,
  UpdateUserInput,
  UserDTO,
} from '@herald/types'

import { del, get, post, put } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

export function fetchUsers(params: ListUsersInput): Promise<PaginatedResult<UserDTO>> {
  const searchParams = new URLSearchParams()

  // Add filters
  if (params.filters?.positionId) {
    searchParams.append('positionId', params.filters.positionId)
  }
  if (params.filters?.positionIds?.length) {
    searchParams.append('positionIds', params.filters.positionIds.join(','))
  }
  if (params.filters?.permissions?.length) {
    searchParams.append('permissions', params.filters.permissions.join(','))
  }
  if (params.filters?.disabled !== undefined) {
    searchParams.append('disabled', String(params.filters.disabled))
  }
  if (params.filters?.emailVerified !== undefined) {
    searchParams.append('emailVerified', String(params.filters.emailVerified))
  }

  // Add pagination
  searchParams.append('page', String(params.pagination.page))
  searchParams.append('limit', String(params.pagination.limit))

  // Add sort if provided
  if (params.sort?.field) {
    searchParams.append('sortField', params.sort.field)
    searchParams.append('sortDirection', params.sort.direction)
  }

  return get<PaginatedResult<UserDTO>>(`${ENDPOINTS.users}?${searchParams.toString()}`)
}

export async function createUser(params: CreateUserInput): Promise<APIResponse<UserDTO>> {
  return post<APIResponse<UserDTO>, CreateUserInput>('/api/users', params)
}

export async function updateUser(params: UpdateUserInput): Promise<APIResponse<UserDTO>> {
  return put<APIResponse<UserDTO>, UpdateUserInput>(`/api/users/${params.id}`, params)
}

export async function disableUser(
  params: DeleteUserInput
): Promise<APIResponse<{ message: string }>> {
  return post<APIResponse<{ message: string }>, DeleteUserInput>(`/api/users/${params.id}`, params)
}

export async function deleteUser(
  params: DeleteUserInput
): Promise<APIResponse<{ message: string }>> {
  return del<APIResponse<{ message: string }>>(`/api/users/${params.id}`)
}

export async function signUpInBetterAuth(params: {
  email: string
  password: string
  name: string
}): Promise<{ id: string }> {
  const authUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_AUTH_URL
  if (!authUrl) {
    throw new Error('BETTER_AUTH_URL is not configured')
  }

  const res = await post<APIResponse<{ user?: { id?: string } }>>(
    `${authUrl}/api/auth/sign-up/email`,
    {
      email: params.email,
      password: params.password,
      name: params.name,
    }
  )
  if (!res.success) {
    throw new Error(`BetterAuth sign-up failed: ${res.error}`)
  }

  const { data } = res

  if (!data?.user?.id) {
    throw new Error('Failed to create auth user: no ID returned')
  }

  return { id: data.user.id }
}

export async function sendWelcomeEmail(email: string): Promise<void> {
  const authUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_AUTH_URL
  if (!authUrl) {
    return
  }

  try {
    await post<APIResponse<{ message: string }>, { email: string }>(
      `${authUrl}/auth/send-welcome-email`,
      { email }
    )
  } catch (emailError) {
    // eslint-disable-next-line no-console
    console.error('Failed to send welcome email:', emailError)
  }
}
