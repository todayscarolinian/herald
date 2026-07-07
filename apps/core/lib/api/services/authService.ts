import type {
  APIResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
} from '@herald/types'

import { post } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { signIn, signOut as authClientSignOut } from '@/lib/auth-client'

export async function credentialsSignIn(
  credentials: LoginRequest
): Promise<{ mustChangePassword: boolean }> {
  const result = await post<APIResponse<Omit<LoginResponse, 'success'>>>(
    ENDPOINTS.api.login,
    credentials
  )

  await signIn.email({
    email: credentials.email,
    password: credentials.password,
    rememberMe: credentials.rememberMe,
  })

  return { mustChangePassword: result.data?.user.mustChangePassword ?? false }
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

  // The custom endpoint above invalidates the session server-side, but only
  // going through the better-auth client updates its session store, so
  // useSession() picks up the logout without a page refresh.
  await authClientSignOut()
}

export function forgotPassword(
  request: ForgotPasswordRequest
): Promise<APIResponse<{ message: string }>> {
  return post<APIResponse<{ message: string }>>(ENDPOINTS.api.forgotPassword, request)
}

export function resetPassword(
  request: ResetPasswordRequest
): Promise<APIResponse<{ message: string }>> {
  return post<APIResponse<{ message: string }>>(ENDPOINTS.api.resetPassword, request)
}

export function changePassword(
  request: ChangePasswordRequest
): Promise<APIResponse<{ message: string }>> {
  return post<APIResponse<{ message: string }>>(ENDPOINTS.api.changePassword, request)
}
