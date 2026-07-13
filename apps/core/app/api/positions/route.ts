import type {
  APIResponse,
  CreatePositionInput,
  Domain,
  PositionDTO,
  PositionFilters,
  PositionSortField,
} from '@herald/types'
import { DEFAULT_PAGINATION, type SortDirection, type SortInput } from '@herald/types'
import { createFirebasePositionRepository, isValidDomain } from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { hasHeraldWriteAccess, verifySessionFromCookie } from '@/lib/api/auth/verify-session'
import { getServerFirestore } from '@/lib/api/services/firebase/firestore/server'

const ALLOWED_SORT_FIELDS: PositionSortField[] = ['name', 'createdAt', 'updatedAt']

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const cookieHeader = request.headers.get('cookie') ?? ''
    const sessionUser = await verifySessionFromCookie(cookieHeader)
    if (!sessionUser) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'No valid session' } },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const filters = parseFilters(url.searchParams)
    const pagination = parsePagination(url.searchParams)
    const sort = parseSort(url.searchParams)

    const repository = createFirebasePositionRepository(getServerFirestore())
    const result = await repository.findAll({ filters, pagination, sort })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const cookieHeader = request.headers.get('cookie') ?? ''
    const sessionUser = await verifySessionFromCookie(cookieHeader)
    if (!sessionUser) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'No valid session' } },
        { status: 401 }
      )
    }
    if (!hasHeraldWriteAccess(sessionUser.domains)) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'FORBIDDEN', message: 'TC Herald access required' } },
        { status: 403 }
      )
    }

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

    if (!Array.isArray(body.domains) || !body.domains.every(isValidDomain)) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '"domains" must be an array of valid Domain values',
          },
        },
        { status: 422 }
      )
    }

    const createData: CreatePositionInput = {
      name: body.name,
      abbreviation: body.abbreviation,
      domains: body.domains,
    }

    const repository = createFirebasePositionRepository(getServerFirestore())
    const createdPosition = await repository.create(createData, sessionUser.id)

    return NextResponse.json<APIResponse<PositionDTO>>(
      { success: true, data: createdPosition },
      { status: 201 }
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

function parseFilters(searchParams: URLSearchParams): PositionFilters {
  const domains = parseListParam(searchParams, 'domains').filter(isValidDomain) as Domain[]
  const search = searchParams.get('search')?.trim()

  return {
    ...(domains.length ? { domains } : {}),
    ...(search ? { search } : {}),
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
