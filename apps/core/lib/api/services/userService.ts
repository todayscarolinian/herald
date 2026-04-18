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

const getInternalApiKeyHeader = () => {
  const internalApiKey = process.env.HERALD_INTERNAL_API_KEY

  if (!internalApiKey) {
    return undefined
  }

  return internalApiKey
}

export function fetchUsers(params: ListUsersInput): Promise<PaginatedResult<UserDTO>> {
  const searchParams = new URLSearchParams()

  // Add filters
  if (params.filters?.search) {
    searchParams.append('search', params.filters.search)
  }
  if (params.filters?.positionIds?.length) {
    searchParams.append('positionIds', params.filters.positionIds.join(','))
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

export function createUser(params: CreateUserInput): Promise<APIResponse<UserDTO>> {
  return post<APIResponse<UserDTO>, CreateUserInput>('/api/users', params)
}

export function updateUser(params: UpdateUserInput): Promise<APIResponse<UserDTO>> {
  return put<APIResponse<UserDTO>, UpdateUserInput>(`/api/users/${params.id}`, params)
}

export function disableUser(params: DeleteUserInput): Promise<APIResponse<{ message: string }>> {
  return post<APIResponse<{ message: string }>, DeleteUserInput>(`/api/users/${params.id}`, params)
}

export function deleteUser(params: DeleteUserInput): Promise<APIResponse<{ message: string }>> {
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Origin: authUrl,
  }

  const internalApiKey = getInternalApiKeyHeader()
  if (internalApiKey) {
    headers['x-herald-internal-api-key'] = internalApiKey
  }

  const res = await fetch(`${authUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      name: params.name,
    }),
  })

  const rawText = await res.text()
  const data = JSON.parse(rawText) as { user?: { id?: string }; message?: string }

  if (!res.ok) {
    throw new Error(data?.message ?? `BetterAuth sign-up failed: ${res.status}`)
  }

  if (!data?.user?.id) {
    throw new Error('Failed to create auth user: no ID returned')
  }

  return { id: data.user.id }
}

export async function sendWelcomeEmail(userId: string, temporaryPassword: string): Promise<void> {
  const authUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_AUTH_URL
  if (!authUrl) {
    return
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const internalApiKey = getInternalApiKeyHeader()
  if (internalApiKey) {
    headers['x-herald-internal-api-key'] = internalApiKey
  }

  try {
    await fetch(`${authUrl}/api/auth/send-welcome-email`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, temporaryPassword }),
    })
  } catch (emailError) {
    // eslint-disable-next-line no-console
    console.error('Failed to send welcome email:', emailError)
  }
}
