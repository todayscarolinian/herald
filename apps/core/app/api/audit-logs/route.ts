import type { APIResponse, AuditLogFilters, AuditLogSortField } from '@herald/types'
import { DEFAULT_PAGINATION, type SortDirection, type SortInput } from '@herald/types'
import { createFirebaseAuditLogRepository } from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { verifySessionFromCookie } from '@/lib/api/auth/verify-session'
import { getServerFirestore } from '@/lib/api/services/firebase/firestore/server'

const ALLOWED_SORT_FIELDS: AuditLogSortField[] = ['action', 'timestamp']

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

    const repository = createFirebaseAuditLogRepository(getServerFirestore())
    const result = await repository.findAll({ filters, pagination, sort })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}

function parseFilters(searchParams: URLSearchParams): AuditLogFilters {
  const action = searchParams.get('action')?.trim()
  const search = searchParams.get('search')?.trim()

  return {
    ...(action ? { action } : {}),
    ...(search ? { search } : {}),
  }
}

function parsePagination(searchParams: URLSearchParams) {
  const page = parsePositiveInteger(searchParams.get('page'), DEFAULT_PAGINATION.page)
  const limit = parsePositiveInteger(searchParams.get('limit'), DEFAULT_PAGINATION.limit)
  return { page, limit }
}

function parseSort(searchParams: URLSearchParams): SortInput<AuditLogSortField> | undefined {
  const field = searchParams.get('sortField')?.trim() as AuditLogSortField | null
  const directionParam = searchParams.get('sortDirection')?.trim().toLowerCase()

  if (!field || !ALLOWED_SORT_FIELDS.includes(field)) {
    return undefined
  }

  const direction: SortDirection = directionParam === 'asc' ? 'asc' : 'desc'

  return { field, direction }
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
