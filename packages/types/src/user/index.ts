import type { Domain } from '../domain/index.ts'
import type { UUID } from '../shared/uid.ts'

export interface UserProfile {
  id: UUID
  name: string
  firstName: string
  middleName?: string
  lastName: string
  email: string
  positions: Position[]
  emailVerified: boolean
  disabled: boolean
  profilePictureURL?: string
  createdAt: string
  updatedAt: string
}

export interface Position {
  id: UUID
  name: string
  abbreviation: string
  domains: Domain[]
  createdAt: string
  updatedAt: string
}
