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
  RESET_PASSWORD: {
    windowSeconds: 300,
    maxRequests: 5,
  },
  CHANGE_PASSWORD: {
    windowSeconds: 300,
    maxRequests: 5,
  },
  SEND_WELCOME_EMAIL: {
    windowSeconds: 60,
    maxRequests: 100,
  },
  VERIFY_SESSION: {
    windowSeconds: 60,
    maxRequests: 60,
  },
  LOGOUT: {
    windowSeconds: 60,
    maxRequests: 20,
  },
} as const
