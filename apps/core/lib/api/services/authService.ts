import { LoginRequest, LoginResponse } from '@herald/types'

import { post } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { signIn } from '@/lib/auth-client'

export function credentialsSignIn(credentials: LoginRequest): Promise<LoginResponse> {
  return post<LoginResponse>(ENDPOINTS.auth.loginCredentials, credentials)
}

export async function googleSignIn(): Promise<void> {
  await signIn.social({ provider: 'google', callbackURL: '/auth/google/callback' })
}

export async function googleGuardCheck(email: string): Promise<void> {
  await post<{ success: boolean }>(ENDPOINTS.auth.loginGoogle, { email })
}

export async function signOut(): Promise<void> {
  await post<void>(ENDPOINTS.auth.logout, {})
}
