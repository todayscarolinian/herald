/**
 * Herald Auth API
 *
 * This module provides functions to interact with the Herald Auth service, including health checks and authentication-related operations. It uses the Fetch API for making HTTP requests and React Query for managing server state in React applications.
 */

import { HealthStatus } from '@herald/types'
import { useQuery } from '@tanstack/react-query'

const getAuthBaseUrl = () => {
  return process.env.NEXT_PUBLIC_AUTH_URL
}

const baseUrl = getAuthBaseUrl()

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  })

  if (!res.ok) {
    const fallback = `Request failed: ${res.status} ${res.statusText}`
    let message = fallback

    try {
      const body = (await res.json()) as { message?: string }
      if (body?.message) {
        message = body.message
      }
    } catch {
      // ignore parse errors and keep fallback
    }

    throw new Error(message)
  }

  return (await res.json()) as T
}

export function useAuthHealth() {
  return useQuery<HealthStatus>({
    queryKey: ['auth', 'health'],
    queryFn: () => request<HealthStatus>('/health'),
    staleTime: 60 * 1000, // 1 minute
  })
}
