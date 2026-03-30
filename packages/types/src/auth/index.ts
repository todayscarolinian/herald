import { UserDTO } from '../dtos/user.dto.ts'
import type { UserProfile } from '../user/index.ts'

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  success: boolean
  session: {
    token: string
    expiresAt: number
  }
  user: UserDTO
}

export interface VerifySessionRequest {
  token: string
}

export interface VerifySessionResponse {
  valid: boolean
  user?: UserProfile
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
