import { LoginRequest, LoginResponse } from '@herald/types'

import { post } from '@/lib/api/client'
import { authClient, signIn } from '@/lib/auth-client'

export function credentialsSignIn(credentials: LoginRequest): Promise<LoginResponse> {
  return post<LoginResponse>('/auth/login/credentials', credentials)
}

export async function googleSignIn(): Promise<void> {
  await signIn.social({ provider: 'google', callbackURL: '/auth/google/callback' })
}

export async function googleGuardCheck(email: string): Promise<void> {
  await post<{ success: boolean }>('/auth/login/google', { email })
}

export async function signOut(): Promise<void> {
  await authClient.signOut()
}
