import { LoginRequest, LoginResponse } from '@herald/types'
import { useMutation } from '@tanstack/react-query'

import { credentialsSignIn, googleGuardCheck, googleSignIn, signOut } from '@/lib/api/services/authService'

export function useCredentialsSignIn() {
  return useMutation<LoginResponse, Error, LoginRequest>({
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
