import type { APIResponse, PositionDTO, UpdatePositionInput } from '@herald/types'
import { createFirebasePositionRepository, isValidDomain } from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { hasHeraldWriteAccess, verifySessionFromCookie } from '@/lib/api/auth/verify-session'
import { getServerFirestore } from '@/lib/api/services/firebase/firestore/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

    const { id } = await params

    if (!id) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Position ID is required' } },
        { status: 400 }
      )
    }

    const body = (await request.json()) as Partial<UpdatePositionInput>

    if (body.name !== undefined && typeof body.name !== 'string') {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '"name" must be a string' } },
        { status: 422 }
      )
    }

    if (body.abbreviation !== undefined && typeof body.abbreviation !== 'string') {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '"abbreviation" must be a string' },
        },
        { status: 422 }
      )
    }

    if (body.domains !== undefined && !Array.isArray(body.domains)) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '"domains" must be an array' },
        },
        { status: 422 }
      )
    }

    if (body.domains && !body.domains.every(isValidDomain)) {
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

    const hasNoUpdatableFields =
      body.name === undefined && body.abbreviation === undefined && body.domains === undefined

    if (hasNoUpdatableFields) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'At least one of "name", "abbreviation", or "domains" must be provided',
          },
        },
        { status: 400 }
      )
    }

    const updateData: UpdatePositionInput = {
      id,
      name: body.name ?? '',
      abbreviation: body.abbreviation ?? '',
      domains: body.domains ?? [],
    }

    const repository = createFirebasePositionRepository(getServerFirestore())
    const updatedPosition = await repository.update(updateData, sessionUser.id)

    return NextResponse.json<APIResponse<PositionDTO>>(
      { success: true, data: updatedPosition },
      { status: 200 }
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

    const { id } = await params

    if (!id) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Position ID is required' } },
        { status: 400 }
      )
    }

    const repository = createFirebasePositionRepository(getServerFirestore())
    await repository.delete({ id }, sessionUser.id)

    return NextResponse.json<APIResponse<{ message: string }>>(
      { success: true, data: { message: `Position ${id} has been deleted` } },
      { status: 200 }
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

function handleRouteError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'
  const isNotFound = message.toLowerCase().includes('not found')

  return NextResponse.json<APIResponse>(
    {
      success: false,
      error: {
        code: isNotFound ? 'NOT_FOUND' : 'INTERNAL_ERROR',
        message,
      },
    },
    { status: isNotFound ? 404 : 500 }
  )
}
