import type { PaginatedResult } from '../dtos/common.dto.ts'
import type {
  CreateUserInput,
  DeleteUserInput,
  GetUserByEmailInput,
  GetUserByIdInput,
  ListUsersInput,
  PositionDistributionDTO,
  TotalUsersDTO,
  UpdateUserInput,
  UserDTO,
} from '../dtos/user.dto.ts'
import type { UUID } from '../shared/uid.ts'

export interface IUserRepository {
  findById(id: GetUserByIdInput): Promise<UserDTO | null>
  findByEmail(email: GetUserByEmailInput): Promise<UserDTO | null>
  findAll(params: ListUsersInput): Promise<PaginatedResult<UserDTO>>
  findByPosition(positionId: UUID): Promise<PaginatedResult<UserDTO>>
  findByPermissions(permissions: string[]): Promise<PaginatedResult<UserDTO>>

  create(user: CreateUserInput): Promise<UserDTO>
  update(user: UpdateUserInput): Promise<UserDTO>
  delete(params: DeleteUserInput): Promise<void>

  getTotalCount(): Promise<TotalUsersDTO>
  getPositionDistribution(): Promise<PositionDistributionDTO[]>

  exists(id: UUID): Promise<boolean>
  emailExists(email: string): Promise<boolean>
}
