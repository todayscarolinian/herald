const baseUrl = process.env.NEXT_PUBLIC_AUTH_URL

type ApiErrorBody = { error?: { message?: string }; message?: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
  })

  const data = (await res.json()) as T & ApiErrorBody

  if (!res.ok) {
    throw new Error(
      data?.error?.message ?? data?.message ?? `Request failed: ${res.status} ${res.statusText}`,
    )
  }

  return data
}

export const get = <T>(path: string) => request<T>(path)

export const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) })
