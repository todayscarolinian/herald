import type { APIResponse } from '../auth/index.ts'
import type { UUID } from './uid.ts'

export interface RateLimitRule {
  windowSeconds: number
  maxRequests: number
  keyPrefix?: string
  methodScope?: 'global' | 'perUser' | 'perIP'
}

export interface RateLimitContext {
  route: string
  method: string
  ip?: string
  userId?: UUID
  now: number
}

export const RATE_LIMIT_ERROR_CODES = {
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
} as const

export type RateLimitErrorCode =
  (typeof RATE_LIMIT_ERROR_CODES)[keyof typeof RATE_LIMIT_ERROR_CODES]

export interface RateLimitResponse {
  allowed: boolean
  limit: RateLimitRule
  remaining: number
  resetAtEpochMs: number
  retryAfterSeconds?: number
  code?: RateLimitErrorCode
}

export const RATE_LIMIT_THRESHOLDS = {
  LOGIN: {
    windowSeconds: 60,
    maxRequests: 5,
  },
  FORGOT_PASSWORD: {
    windowSeconds: 300,
    maxRequests: 1,
  },
  SEND_VERIFICATION_EMAIL: {
    windowSeconds: 60,
    maxRequests: 2,
  },
} as const

export type RateLimitThresholdKey = keyof typeof RATE_LIMIT_THRESHOLDS

export type RateLimitApiResponse<T = unknown> = APIResponse<T> & {
  rateLimit?: RateLimitResponse
}

export type RateLimitErrorResponse = APIResponse<never> & {
  success: false
  error: {
    code: RateLimitErrorCode
    message: string
  }
  rateLimit: RateLimitResponse
}
