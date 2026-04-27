import { UUID } from '../shared/uid.ts'

export interface Permission {
  id: UUID
  name: string
  domain: string
  description: string
  createdAt: string
  updatedAt: string
}
