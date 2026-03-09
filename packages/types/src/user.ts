export interface UserProfile {
  id: string
  email: string
  firstName: string
  middleName?: string
  lastName: string
  positionId: string
  emailVerified: boolean
  disabled: boolean
  createdAt: string
  updatedAt: string
}
