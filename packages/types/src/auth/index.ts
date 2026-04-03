import { UserDTO } from '../dtos/user.dto.ts'

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AuthSessionPayload {
  token: string
  expiresAt: number
}

export interface LoginResponse {
  success: boolean
  session: AuthSessionPayload
  user: UserDTO
}

export interface VerifySessionRequest {
  token: string
}

export interface AuthUserPayload {
  id: string
  email: string
  firstName: string
  middleName?: string
  lastName: string
  emailVerified: boolean
  disabled: boolean
  createdAt: string
  updatedAt: string
}

export interface VerifySessionResponse {
  valid: boolean
  session?: AuthSessionPayload
  user?: AuthUserPayload
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
