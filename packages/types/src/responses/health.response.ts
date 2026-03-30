/**
 * This file defines the structure of the response returned by the health endpoint of the API.
 */

export interface HealthResponse {
  status: 'ok' | 'error'
  service: string
  version: string
  timestamp: string
}
