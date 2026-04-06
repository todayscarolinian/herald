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

export async function signUpInBetterAuth(params: {
  email: string
  password: string
  name: string
}): Promise<{ id: string }> {
  const authUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_AUTH_URL
  if (!authUrl) {
    throw new Error('BETTER_AUTH_URL is not configured')
  }

  const res = await fetch(`${authUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: authUrl,
    },
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

export async function sendWelcomeEmail(email: string): Promise<void> {
  const authUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_AUTH_URL
  if (!authUrl) {
    return
  }

  try {
    await fetch(`${authUrl}/auth/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
  } catch (emailError) {
    // eslint-disable-next-line no-console
    console.error('Failed to send welcome email:', emailError)
  }
}
