import type {
  APIResponse,
  DeletePositionInput,
  PositionDTO,
  UpdatePositionInput,
} from '@herald/types'
import { NextRequest, NextResponse } from 'next/server'

// import { createFirebasePositionRepository } from '@herald/utils'
// import { getServerFirestore } from '@/lib/api/services/firebase/firestore/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
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

    if (body.permissions !== undefined && !Array.isArray(body.permissions)) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '"permissions" must be an array' },
        },
        { status: 422 }
      )
    }

    if (body.permissions && !body.permissions.every((item) => typeof item === 'string')) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '"permissions" must be an array of strings',
          },
        },
        { status: 422 }
      )
    }

    const hasNoUpdatableFields =
      body.name === undefined && body.abbreviation === undefined && body.permissions === undefined

    if (hasNoUpdatableFields) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'At least one of "name", "abbreviation", or "permissions" must be provided',
          },
        },
        { status: 400 }
      )
    }

    const updateData: UpdatePositionInput = {
      id,
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.abbreviation !== undefined ? { abbreviation: body.abbreviation } : {}),
      ...(body.permissions !== undefined ? { permissions: body.permissions } : {}),
    }

    // TODO: Repository implementation is still WIP.
    // const repository = createFirebasePositionRepository(getServerFirestore())
    // const updatedPosition = await repository.update(updateData)

    const now = new Date().toISOString()
    const updatedPosition: PositionDTO = {
      id,
      name: updateData.name ?? 'WIP Position',
      abbreviation: updateData.abbreviation ?? 'WIP',
      permissions: updateData.permissions ?? [],
      createdAt: now,
      updatedAt: now,
    }

    return NextResponse.json<APIResponse<PositionDTO>>(
      { success: true, data: updatedPosition },
      { status: 200 }
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json<APIResponse>(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Position ID is required' } },
        { status: 400 }
      )
    }

    const deleteData: DeletePositionInput = { id }

    // TODO: Repository implementation is still WIP.
    // const repository = createFirebasePositionRepository(getServerFirestore())
    // await repository.delete(deleteData)

    return NextResponse.json<APIResponse<{ message: string }>>(
      {
        success: true,
        data: { message: `Position ${deleteData.id} has been deleted` },
      },
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
