import type {
  APIResponse,
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
} from '@herald/types'

import { post } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { signIn } from '@/lib/auth-client'

export async function credentialsSignIn(credentials: LoginRequest): Promise<void> {
  await post<APIResponse>('/api/login', credentials)

  signIn.email({
    email: credentials.email,
    password: credentials.password,
    rememberMe: credentials.rememberMe,
  })
}

export async function googleSignIn(): Promise<void> {
  const callbackURL = process.env.NEXT_PUBLIC_CORE_URL

  if (!callbackURL) {
    throw new Error('NEXT_PUBLIC_CORE_URL is not defined')
  }

  const normalizedCallbackURL = callbackURL.endsWith('/') ? callbackURL.slice(0, -1) : callbackURL
  await signIn.social({
    provider: 'google',
    callbackURL: normalizedCallbackURL,
    errorCallbackURL: `${normalizedCallbackURL}/login`,
  })
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
  return post<APIResponse<{ message: string }>>(ENDPOINTS.auth.resetPassword, request)
}
