import type {
  CreatePermissionInput,
  DeletePermissionInput,
  GetPermissionByIdInput,
  ListPermissionsInput,
  PermissionDTO,
  PermissionListDTO,
  PermissionPositionDistributionDTO,
  TotalPermissionsDTO,
  UpdatePermissionInput,
} from '../dtos/permission.dto.ts'
import type { UUID } from '../shared/uid.ts'

export interface IPermissionRepository {
  findById(id: GetPermissionByIdInput): Promise<PermissionDTO | null>
  findAll(params: ListPermissionsInput): Promise<PermissionListDTO>

  create(permission: CreatePermissionInput): Promise<PermissionDTO>
  update(permission: UpdatePermissionInput): Promise<PermissionDTO>
  delete(params: DeletePermissionInput): Promise<void>

  getTotalCount(): Promise<TotalPermissionsDTO>
  getPermissionPositionDistribution(): Promise<PermissionPositionDistributionDTO[]>

  exists(id: UUID): Promise<boolean>
}
