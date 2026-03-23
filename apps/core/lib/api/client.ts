const getAuthBaseUrl = () => {
  return process.env.NEXT_PUBLIC_AUTH_URL
}

type PostOptions = Omit<RequestInit, 'method' | 'body' | 'headers'> & {
  headers?: Record<string, string>
}

export async function post<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  options?: PostOptions
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

