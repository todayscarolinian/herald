import { UserProfile } from "./user.js";

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  session: {
    token: string;
    expiresAt: number;
  };
  user: UserProfile;
}

export interface VerifySessionRequest {
  token: string;
}

export interface VerifySessionResponse {
  valid: boolean;
  user?: UserProfile;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
