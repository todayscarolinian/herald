/**
 * This file defines the structure of the response returned by the index endpoint of the API.
 */

import { APIResponse } from '../auth/index.ts'

export interface IndexData {
  service: string
  version: string
  status: 'ok' | 'error'
  summary: string
  endpoints: Record<string, string>
  timestamp: string
}

export type IndexResponse = APIResponse<IndexData>
