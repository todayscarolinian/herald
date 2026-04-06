import {
  DEFAULT_PAGINATION,
  SortDirection,
  SortInput,
  type UserFilters,
  type UserSortField,
} from '@herald/types'
import { createFirebaseUserRepository } from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { getServerFirestore } from '@/lib/api/services/firebase/firestore/server'

const ALLOWED_SORT_FIELDS: UserSortField[] = [
  'firstName',
  'lastName',
  'email',
  'createdAt',
  'updatedAt',
]

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const filters = parseFilters(url.searchParams)
    const pagination = parsePagination(url.searchParams)
    const sort = parseSort(url.searchParams)

    const repository = createFirebaseUserRepository(getServerFirestore())
    const result = await repository.findAll({ filters, pagination, sort })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}

function parseFilters(searchParams: URLSearchParams): UserFilters {
  const positionId = searchParams.get('positionId')?.trim()
  const positionIds = parseListParam(searchParams, 'positionIds')
  const permissions = parseListParam(searchParams, 'permissions')
  const disabled = parseBooleanParam(searchParams.get('disabled'))
  const emailVerified = parseBooleanParam(searchParams.get('emailVerified'))

  return {
    ...(positionId ? { positionId } : {}),
    ...(positionIds.length ? { positionIds } : {}),
    ...(permissions.length ? { permissions } : {}),
    ...(disabled !== undefined ? { disabled } : {}),
    ...(emailVerified !== undefined ? { emailVerified } : {}),
  }
}

function parsePagination(searchParams: URLSearchParams) {
  const page = parsePositiveInteger(searchParams.get('page'), DEFAULT_PAGINATION.page)
  const limit = parsePositiveInteger(searchParams.get('limit'), DEFAULT_PAGINATION.limit)
  return { page, limit }
}

function parseSort(searchParams: URLSearchParams): SortInput<UserSortField> | undefined {
  const field = searchParams.get('sortField')?.trim() as UserSortField | null
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

  return [...new Set(values)]
}

function parseBooleanParam(value: string | null): boolean | undefined {
  if (value === null) {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  if (normalized === 'true') {
    return true
  }

  if (normalized === 'false') {
    return false
  }

  throw new Error('Invalid boolean query parameter value; use "true" or "false"')
}

function parsePositiveInteger(value: string | null, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    throw new Error('Invalid pagination value; page and limit must be positive integers')
  }

  return parsed
}

function handleRouteError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  const status = message.includes('Invalid') || message.includes('Missing') ? 400 : 500

  return NextResponse.json({ error: message }, { status })
}
