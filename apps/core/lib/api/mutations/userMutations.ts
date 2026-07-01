import type {
  APIResponse,
  BulkCreateUserRowInput,
  BulkUpdateUserRowInput,
  BulkUserResult,
  CreateUserInput,
  DeleteUserInput,
  UpdateUserInput,
  UserDTO,
} from '@herald/types'
import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'

import {
  bulkCreateUsers,
  bulkUpdateUsers,
  createUser,
  deleteUser,
  disableUser,
  updateProfile,
  UpdateProfileInput,
  updateUser,
} from '@/lib/api/services/userService'

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation<APIResponse<UserDTO>, Error, CreateUserInput>({
    mutationFn: createUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation<APIResponse<UserDTO>, Error, UpdateUserInput>({
    mutationFn: updateUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation<APIResponse<UserDTO>, Error, UpdateProfileInput>({
    mutationFn: updateProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['myProfile'] })
    },
  })
}

export function useDisableUser() {
  const queryClient = useQueryClient()

  return useMutation<APIResponse<{ message: string }>, Error, DeleteUserInput>({
    mutationFn: disableUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation<APIResponse<{ message: string }>, Error, DeleteUserInput>({
    mutationFn: deleteUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useBulkCreateUsers() {
  const queryClient = useQueryClient()

  return useMutation<
    APIResponse<BulkUserResult>,
    Error,
    { users: BulkCreateUserRowInput[]; requestedById: string }
  >({
    mutationFn: bulkCreateUsers,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useBulkUpdateUsers() {
  const queryClient = useQueryClient()

  return useMutation<
    APIResponse<BulkUserResult>,
    Error,
    { users: BulkUpdateUserRowInput[]; requestedById: string }
  >({
    mutationFn: bulkUpdateUsers,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
