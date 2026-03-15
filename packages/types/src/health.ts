export interface HealthStatus {
  status: 'ok' | 'error'
  service: string
  version: string
  timestamp: string
}
