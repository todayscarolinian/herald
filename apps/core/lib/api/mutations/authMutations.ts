import type { APIResponse, ForgotPasswordRequest, ResetPasswordRequest } from '@herald/types'
import { LoginRequest } from '@herald/types'
import { useMutation } from '@tanstack/react-query'

import {
  credentialsSignIn,
  forgotPassword,
  googleGuardCheck,
  googleSignIn,
  resetPassword,
  signOut,
} from '@/lib/api/services/authService'

export function useCredentialsSignIn() {
  return useMutation<void, Error, LoginRequest>({
    mutationFn: credentialsSignIn,
  })
}

export function useGoogleSignIn() {
  return useMutation<void, Error, void>({
    mutationFn: googleSignIn,
  })
}

export function useGoogleGuardCheck() {
  return useMutation<void, Error, string>({
    mutationFn: googleGuardCheck,
  })
}

export function useSignOut() {
  return useMutation<void, Error, void>({
    mutationFn: signOut,
  })
}

export function useResetPassword() {
  return useMutation<APIResponse<{ message: string }>, Error, ResetPasswordRequest>({
    mutationFn: resetPassword,
  })
}

export function useForgotPassword() {
  return useMutation<APIResponse<{ message: string }>, Error, ForgotPasswordRequest>({
    mutationFn: forgotPassword,
  })
}
