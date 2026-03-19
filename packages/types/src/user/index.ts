import type { UUID } from '../shared/uid.ts'

export interface UserProfile {
  id: UUID
  firstName: string
  middleName?: string
  lastName: string
  email: string
  password: string
  positionId: UUID
  emailVerified: boolean
  disabled: boolean
  createdAt: string
  updatedAt: string
}

export interface Position {
  id: UUID
  name: string
  abbreviation: string
  description?: string
  permissions: string[]
  createdAt: string
  updatedAt: string
}
