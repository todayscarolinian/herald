import {
  CreatePositionInput,
  GetPositionByIdInput,
  ListPositionsInput,
  PositionDTO,
  PositionListDTO,
  TotalPositionsDTO,
} from '../dtos/position.dto.ts'
import { UUID } from '../shared/uid.ts'

export interface IPositionRepository {
  findById(id: GetPositionByIdInput): Promise<PositionDTO | null>
  findAll(params: ListPositionsInput): Promise<PositionListDTO>

  create(position: CreatePositionInput): Promise<PositionDTO>
  update(position: PositionDTO): Promise<PositionDTO>
  delete(id: UUID): Promise<void>

  getTotalCount(): Promise<TotalPositionsDTO>

  exists(id: UUID): Promise<boolean>
}
