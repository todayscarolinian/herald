import {
  CreatePositionInput,
  DeletePositionInput,
  GetPositionByIdInput,
  ListPositionsInput,
  PositionDTO,
  PositionListDTO,
  TotalPositionsDTO,
  UpdatePositionInput,
} from '../dtos/position.dto.ts'
import { UUID } from '../shared/uid.ts'

export interface IPositionRepository {
  findById(id: GetPositionByIdInput): Promise<PositionDTO | null>
  findAll(params: ListPositionsInput): Promise<PositionListDTO>

  create(position: CreatePositionInput): Promise<PositionDTO>
  update(position: UpdatePositionInput): Promise<PositionDTO>
  delete(input: DeletePositionInput): Promise<void>

  getTotalCount(): Promise<TotalPositionsDTO>

  exists(id: UUID): Promise<boolean>
}
