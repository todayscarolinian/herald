import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export interface ApiExceptionOptions<TData = unknown> {
  status: ContentfulStatusCode
  code: string
  message: string
  data?: TData
  headers?: Record<string, string>
}

export class ApiException<TData = unknown> extends HTTPException {
  readonly code: string
  readonly data?: TData
  readonly headersMap?: Record<string, string>

  constructor(options: ApiExceptionOptions<TData>) {
    super(options.status, { message: options.message })
    this.code = options.code
    this.data = options.data
    this.headersMap = options.headers
  }
}
