import type {
  APIResponse,
  CreatePositionInput,
  PaginatedResult,
  PositionDTO,
  PositionFilters,
  PositionSortField,
} from '@herald/types'
import { DEFAULT_PAGINATION, type SortDirection, type SortInput } from '@herald/types'
import { NextRequest, NextResponse } from 'next/server'

// import { createFirebasePositionRepository } from '@herald/utils'
// import { getServerFirestore } from '@/lib/api/services/firebase/firestore/server'

const ALLOWED_SORT_FIELDS: PositionSortField[] = ['name', 'createdAt', 'updatedAt']

export function GET(request: NextRequest): NextResponse {
  try {
    const url = new URL(request.url)
    const _filters = parseFilters(url.searchParams)
    const pagination = parsePagination(url.searchParams)
    const _sort = parseSort(url.searchParams)
    void _filters
    void _sort

    // TODO: Repository implementation is still WIP.
    // const repository = createFirebasePositionRepository(getServerFirestore())
    // const result = await repository.findAll({ filters, pagination, sort })

    const result: PaginatedResult<PositionDTO> = {
      items: [],
      total: 0,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<CreatePositionInput>

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '"name" is required' } },
        { status: 422 }
      )
    }

    if (!body.abbreviation || typeof body.abbreviation !== 'string') {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '"abbreviation" is required' },
        },
        { status: 422 }
      )
    }

    if (!Array.isArray(body.permissions)) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '"permissions" must be an array' },
        },
        { status: 422 }
      )
    }

    const createData: CreatePositionInput = {
      name: body.name,
      abbreviation: body.abbreviation,
      permissions: body.permissions,
    }

    // TODO: Repository implementation is still WIP.
    // const repository = createFirebasePositionRepository(getServerFirestore())
    // const createdPosition = await repository.create(createData)

    const createdPosition: PositionDTO = {
      id: 'position-wip',
      name: createData.name,
      abbreviation: createData.abbreviation,
      permissions: createData.permissions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userCount: 0,
    }

    return NextResponse.json<APIResponse<PositionDTO>>(
      { success: true, data: createdPosition },
      { status: 201 }
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

function parseFilters(searchParams: URLSearchParams): PositionFilters {
  const permissions = parseListParam(searchParams, 'permissions')

  return {
    ...(permissions.length ? { permissions } : {}),
  }
}

function parsePagination(searchParams: URLSearchParams) {
  const page = parsePositiveInteger(searchParams.get('page'), DEFAULT_PAGINATION.page)
  const limit = parsePositiveInteger(searchParams.get('limit'), DEFAULT_PAGINATION.limit)
  return { page, limit }
}

function parseSort(searchParams: URLSearchParams): SortInput<PositionSortField> | undefined {
  const field = searchParams.get('sortField')?.trim() as PositionSortField | null
  const directionParam = searchParams.get('sortDirection')?.trim().toLowerCase()

  if (!field || !ALLOWED_SORT_FIELDS.includes(field)) {
    return undefined
  }

  const direction: SortDirection = directionParam === 'asc' ? 'asc' : 'desc'

  return {
    field,
    direction,
  }
}

function parseListParam(searchParams: URLSearchParams, key: string): string[] {
  const values = searchParams.getAll(key).flatMap((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )

  return Array.from(new Set(values))
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function handleRouteError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'

  return NextResponse.json<APIResponse>(
    {
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
    },
    { status: 500 }
  )
}
