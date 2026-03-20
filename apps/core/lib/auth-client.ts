import { createAuthClient } from 'better-auth/react'

const baseURL = process.env.NEXT_PUBLIC_AUTH_URL

type AuthClient = ReturnType<typeof createAuthClient>

export const authClient: AuthClient = createAuthClient({
  ...(baseURL ? { baseURL } : {}),
})

export const { signIn, signUp, useSession } = authClient
