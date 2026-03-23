/**
 * This file defines the structure of the response returned by the index endpoint of the API.
 */

export interface IndexResponse {
  service: string
  version: string
  status: 'ok' | 'error'
  summary: string
  endpoints: Record<string, string>
  timestamp: string
}
