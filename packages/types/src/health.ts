export interface HealthStatus {
  status: 'ok' | 'error'
  service: string
  version: string
  timestamp: string
}

export interface IndexResponse {
  service: string
  version: string
  status: 'ok' | 'error'
  summary: string
  endpoints: Record<string, string>
  timestamp: string
}
