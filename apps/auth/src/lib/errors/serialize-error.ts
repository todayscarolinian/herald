import type { APIResponse, RateLimitResponse } from '@herald/types'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { ApiException } from './api-exception.ts'

interface SerializedError {
  status: ContentfulStatusCode
  body: APIResponse<unknown>
  headers?: Record<string, string>
}

function toQuotaPayload(rateLimit: RateLimitResponse) {
  return {
    retryAfterSeconds: rateLimit.retryAfterSeconds,
    quota: {
      remaining: rateLimit.remaining,
      maxRequests: rateLimit.limit.maxRequests,
      windowSeconds: rateLimit.limit.windowSeconds,
      resetAtEpochMs: rateLimit.resetAtEpochMs,
    },
  }
}

export function serializeError(err: unknown): SerializedError {
  if (err instanceof ApiException) {
    const maybeRateLimit = (err.data as { rateLimit?: RateLimitResponse } | undefined)?.rateLimit

    return {
      status: err.status,
      body: {
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
        data: maybeRateLimit ? toQuotaPayload(maybeRateLimit) : err.data,
      },
      headers: err.headersMap,
    }
  }

  if (err instanceof HTTPException) {
    return {
      status: err.status,
      body: {
        success: false,
        error: {
          code: 'HTTP_EXCEPTION',
          message: err.message || 'Request failed',
        },
      },
    }
  }

  return {
    status: 500,
    body: {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
  }
}
