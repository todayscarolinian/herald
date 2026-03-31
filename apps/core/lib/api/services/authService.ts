import type {
  APIResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
} from '@herald/types'

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

export function forgotPassword(
  request: ForgotPasswordRequest
): Promise<APIResponse<{ message: string }>> {
  return post<APIResponse<{ message: string }>>(ENDPOINTS.auth.forgotPassword, request)
}

export function resetPassword(
  request: ResetPasswordRequest
): Promise<APIResponse<{ message: string }>> {
  // Backend expects: { token, newPassword }
  return post<APIResponse<{ message: string }>>(ENDPOINTS.auth.resetPassword, request)
}
