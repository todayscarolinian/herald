const getAuthBaseUrl = () => {
  return process.env.NEXT_PUBLIC_AUTH_URL
}

type ApiErrorBody = { error?: { message?: string }; message?: string }

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
}

/**
 * Generic request helper for GET and other verbs.
 */
async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const baseUrl = getAuthBaseUrl()
  if (!baseUrl) {
    throw new Error('Auth API base URL is not configured.')
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
  })

  const data = (await res.json()) as T & ApiErrorBody

  if (!res.ok) {
    throw new Error(
      data?.error?.message ?? data?.message ?? `Request failed: ${res.status} ${res.statusText}`
    )
  }

  return data
}

export const get = <T>(path: string) => request<T>(path)

/**
 * API POST helper with enhanced error handling and custom options.
 */
export async function post<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  options?: RequestOptions
): Promise<TResponse> {
  const baseUrl = getAuthBaseUrl()
  if (!baseUrl) {
    throw new Error('Auth API base URL is not configured.')
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`
    try {
      const parsed = (await res.json()) as { message?: string; error?: { message?: string } }
      message = parsed?.error?.message ?? parsed?.message ?? message
    } catch {
      // Keep fallback message
    }

    throw new Error(message)
  }

  return (await res.json()) as TResponse
}

/**
 * API DELETE helper with enhanced error handling and custom options.
 */
export async function del<TResponse>(path: string, options?: RequestOptions): Promise<TResponse> {
  const baseUrl = getAuthBaseUrl()
  if (!baseUrl) {
    throw new Error('Auth API base URL is not configured.')
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: 'DELETE',
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`
    try {
      const parsed = (await res.json()) as { message?: string; error?: { message?: string } }
      message = parsed?.error?.message ?? parsed?.message ?? message
    } catch {
      // Keep fallback message
    }

    throw new Error(message)
  }

  return (await res.json()) as TResponse
}
