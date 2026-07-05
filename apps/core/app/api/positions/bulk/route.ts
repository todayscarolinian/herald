import type {
  APIResponse,
  BulkCreatePositionRowInput,
  BulkPositionOperationFailure,
  BulkPositionResult,
  BulkUpdatePositionRowInput,
  CreatePositionInput,
  Domain,
  PositionDTO,
  UpdatePositionInput,
} from '@herald/types'
import { createFirebasePositionRepository, isValidDomain, MAX_BULK_BATCH_SIZE } from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { buildNameToIdMap } from '@/lib/api/services/firebase/firestore/collection-lookup'
import { getServerFirestore } from '@/lib/api/services/firebase/firestore/server'

const POSITIONS_COLLECTION = 'positions'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      mode?: string
      positions?: unknown[]
      requestedById?: string
    }

    const { mode, positions, requestedById } = body

    if (mode !== 'create' && mode !== 'update') {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: { code: 'BAD_REQUEST', message: '"mode" must be "create" or "update"' },
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(positions) || positions.length === 0) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: { code: 'BAD_REQUEST', message: '"positions" must be a non-empty array' },
        },
        { status: 400 }
      )
    }

    if (positions.length > MAX_BULK_BATCH_SIZE) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: `Batch size exceeds maximum of ${MAX_BULK_BATCH_SIZE} rows`,
          },
        },
        { status: 400 }
      )
    }

    if (!requestedById || typeof requestedById !== 'string') {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '"requestedById" is required' },
        },
        { status: 422 }
      )
    }

    const firestore = getServerFirestore()
    const positionRepository = createFirebasePositionRepository(firestore)

    // Fetch all positions once to build a name→id lookup map
    const positionNameToId = await buildNameToIdMap(firestore, POSITIONS_COLLECTION)

    const succeeded: PositionDTO[] = []
    const failed: BulkPositionOperationFailure[] = []

    if (mode === 'create') {
      const rows = positions as BulkCreatePositionRowInput[]
      const claimedNames = new Set(positionNameToId.keys())

      for (let index = 0; index < rows.length; index++) {
        const row = rows[index]!
        const rowNumber = index + 1

        try {
          if (!row.name || !row.abbreviation) {
            failed.push({
              row: rowNumber,
              name: row.name ?? '',
              error: 'Missing required fields: name, abbreviation',
            })
            continue
          }

          const normalizedName = row.name.toLowerCase()
          if (claimedNames.has(normalizedName)) {
            failed.push({
              row: rowNumber,
              name: row.name,
              error: 'A position with that name already exists',
            })
            continue
          }

          const domains = validateDomains(row.domains ?? [])
          if (domains === null) {
            const unknownDomains = (row.domains ?? []).filter((d) => !isValidDomain(d))
            failed.push({
              row: rowNumber,
              name: row.name,
              error: `Unknown domain(s): ${unknownDomains.join(', ')}`,
            })
            continue
          }

          const createData: CreatePositionInput = {
            name: row.name,
            abbreviation: row.abbreviation,
            domains,
            createdById: requestedById,
          }

          const position = await positionRepository.create(createData)
          claimedNames.add(normalizedName)

          succeeded.push(position)
        } catch (error) {
          failed.push({
            row: rowNumber,
            name: (rows[index] as BulkCreatePositionRowInput).name ?? '',
            error: error instanceof Error ? error.message : 'Unexpected error',
          })
        }
      }
    } else {
      const rows = positions as BulkUpdatePositionRowInput[]

      for (let index = 0; index < rows.length; index++) {
        const row = rows[index]!
        const rowNumber = index + 1

        try {
          if (!row.name || !row.abbreviation) {
            failed.push({
              row: rowNumber,
              name: row.name ?? '',
              error: 'Missing required fields: name, abbreviation',
            })
            continue
          }

          const existingId = positionNameToId.get(row.name.toLowerCase())
          if (!existingId) {
            failed.push({
              row: rowNumber,
              name: row.name,
              error: 'No position found with that name',
            })
            continue
          }

          const domains = validateDomains(row.domains ?? [])
          if (domains === null) {
            const unknownDomains = (row.domains ?? []).filter((d) => !isValidDomain(d))
            failed.push({
              row: rowNumber,
              name: row.name,
              error: `Unknown domain(s): ${unknownDomains.join(', ')}`,
            })
            continue
          }

          const updateData: UpdatePositionInput = {
            id: existingId,
            name: row.name,
            abbreviation: row.abbreviation,
            domains,
            updatedById: requestedById,
          }

          const updatedPosition = await positionRepository.update(updateData)
          succeeded.push(updatedPosition)
        } catch (error) {
          failed.push({
            row: rowNumber,
            name: (rows[index] as BulkUpdatePositionRowInput).name ?? '',
            error: error instanceof Error ? error.message : 'Unexpected error',
          })
        }
      }
    }

    const result: BulkPositionResult = { succeeded, failed }
    return NextResponse.json<APIResponse<BulkPositionResult>>(
      { success: true, data: result },
      { status: 200 }
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[POST /api/positions/bulk] Unexpected error:', error)

    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
}

function validateDomains(domains: string[]): Domain[] | null {
  return domains.every(isValidDomain) ? domains : null
}
