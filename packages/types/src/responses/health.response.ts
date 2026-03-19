/**
 * This file defines the structure of the response returned by the health endpoint of the API.
 */

import { APIResponse } from '../auth/index.ts'

export interface HealthStatusData {
  status: 'ok' | 'error'
  service: string
  version: string
  timestamp: string
}

export type HealthResponse = APIResponse<HealthStatusData>
