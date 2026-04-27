import type { RateLimitResponse } from '@herald/types'

import { ApiException } from './api-exception.ts'

export type RateLimitStatusCode = 400 | 403 | 429

interface RateLimitExceptionOptions {
  status?: RateLimitStatusCode
  code?: string
  message?: string
}

interface RateLimitErrorData {
  rateLimit: RateLimitResponse
}

export class RateLimitException extends ApiException<RateLimitErrorData> {
  constructor(rateLimit: RateLimitResponse, options?: RateLimitExceptionOptions) {
    const retryAfter = rateLimit.retryAfterSeconds

    super({
      status: options?.status ?? 429,
      code: options?.code ?? 'TOO_MANY_REQUESTS',
      message: options?.message ?? 'Too many requests. Please try again later.',
      data: { rateLimit },
      headers: retryAfter ? { 'Retry-After': String(retryAfter) } : undefined,
    })
  }
}
