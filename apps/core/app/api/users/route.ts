import type { APIResponse, CreateUserInput, UserDTO } from '@herald/types'
import {
  DEFAULT_PAGINATION,
  SortDirection,
  SortInput,
  type UserFilters,
  type UserSortField,
} from '@herald/types'
import {
  createFirebaseUserRepository,
  isValidPassword,
  PASSWORD_STRENGTH_REQUIREMENTS,
} from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { sendWelcomeEmail, signUpInBetterAuth } from '@/lib/api/services/userService'
import { firestore } from '@/lib/firebase'

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

    const repository = createFirebaseUserRepository(firestore)
    const result = await repository.findAll({ filters, pagination, sort })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as Partial<CreateUserInput>

  const { firstName, middleName, lastName, email, password, positions } = body

  if (!firstName || !lastName || !email || !password || !positions) {
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Missing required fields: firstName, lastName, email, password, positions',
        },
      },
      { status: 400 }
    )
  }

  if (!firstName || typeof firstName !== 'string') {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'VALIDATION_ERROR', message: '"firstName" is required' } },
      { status: 422 }
    )
  }

  if (!lastName || typeof lastName !== 'string') {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'VALIDATION_ERROR', message: '"lastName" is required' } },
      { status: 422 }
    )
  }

  if (!email || typeof email !== 'string') {
    return NextResponse.json<APIResponse>(
      { success: false, error: { code: 'VALIDATION_ERROR', message: '"email" is required' } },
      { status: 422 }
    )
  }

  if (!password || typeof password !== 'string' || !isValidPassword(password)) {
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `"password" is required. ${PASSWORD_STRENGTH_REQUIREMENTS}`,
        },
      },
      { status: 422 }
    )
  }

  if (!Array.isArray(positions)) {
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '"positions" must be an array' },
      },
      { status: 422 }
    )
  }

  const firebaseUserRepository = createFirebaseUserRepository(firestore)

  let user: UserDTO
  try {
    // Creates the user in BetterAuth to handle account and user creation
    const authUser = await signUpInBetterAuth({
      email,
      password,
      name: `${firstName} ${lastName}`,
    })

    // Then sets additional user details in Firestore
    user = await firebaseUserRepository.create({
      id: authUser.id,
      firstName,
      middleName: typeof middleName === 'string' ? middleName : undefined,
      lastName,
      email,
      password,
      positions,
    })

    await sendWelcomeEmail(email)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'

    if (
      message.toLowerCase().includes('already exists') ||
      message.toLowerCase().includes('email-already-in-use') ||
      message.toLowerCase().includes('user already exists')
    ) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: { code: 'CONFLICT', message: 'A user with that email already exists' },
        },
        { status: 409 }
      )
    }

    if (
      message.toLowerCase().includes('invalid input') ||
      message.toLowerCase().includes('validation')
    ) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'VALIDATION_ERROR', message } },
        { status: 422 }
      )
    }

    // eslint-disable-next-line no-console
    console.error('[POST /api/users] Unexpected error:', error)
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }

  return NextResponse.json<APIResponse<UserDTO>>({ success: true, data: user }, { status: 201 })
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
