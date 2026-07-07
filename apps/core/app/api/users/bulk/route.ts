import type {
  APIResponse,
  BulkCreateUserRowInput,
  BulkOperationFailure,
  BulkUpdateUserRowInput,
  BulkUserResult,
  CreateUserInput,
  UpdateUserInput,
  UserDTO,
} from '@herald/types'
import {
  createFirebaseUserRepository,
  MAX_BULK_BATCH_SIZE,
  PASSWORD_STRENGTH_REQUIREMENTS,
} from '@herald/utils'
import { NextRequest, NextResponse } from 'next/server'

import { hasHeraldWriteAccess, verifySessionFromCookie } from '@/lib/api/auth/verify-session'
import { buildNameToIdMap } from '@/lib/api/services/firebase/firestore/collection-lookup'
import { getServerFirestore } from '@/lib/api/services/firebase/firestore/server'
import { sendWelcomeEmail, signUpInBetterAuth } from '@/lib/api/services/userService'

const POSITIONS_COLLECTION = 'positions'
const PASSWORD_SPECIAL_CHARACTERS = '!@#$%^&*'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const cookieHeader = req.headers.get('cookie') ?? ''
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

    const body = (await req.json()) as {
      mode?: string
      users?: unknown[]
    }

    const { mode, users } = body

    if (mode !== 'create' && mode !== 'update') {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: { code: 'BAD_REQUEST', message: '"mode" must be "create" or "update"' },
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: { code: 'BAD_REQUEST', message: '"users" must be a non-empty array' },
        },
        { status: 400 }
      )
    }

    if (users.length > MAX_BULK_BATCH_SIZE) {
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

    const firestore = getServerFirestore()
    const userRepository = createFirebaseUserRepository(firestore)

    // Fetch all positions once to build a name→id lookup map
    const positionNameToId = await buildNameToIdMap(firestore, POSITIONS_COLLECTION)

    const succeeded: UserDTO[] = []
    const failed: BulkOperationFailure[] = []

    if (mode === 'create') {
      const rows = users as BulkCreateUserRowInput[]
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index]!
        const rowNumber = index + 1

        try {
          if (!row.firstName || !row.lastName || !row.email) {
            failed.push({
              row: rowNumber,
              email: row.email ?? '',
              error: 'Missing required fields: firstName, lastName, email',
            })
            continue
          }

          const positionIds = resolvePositionIds(
            row.positionNames ?? [],
            positionNameToId,
            rowNumber
          )
          if (positionIds === null) {
            const unknownNames = (row.positionNames ?? []).filter(
              (n) => !positionNameToId.has(n.toLowerCase())
            )
            failed.push({
              row: rowNumber,
              email: row.email,
              error: `Unknown position(s): ${unknownNames.join(', ')}`,
            })
            continue
          }

          const existingUser = await userRepository.findByEmail({ email: row.email })
          if (existingUser) {
            failed.push({
              row: rowNumber,
              email: row.email,
              error: 'A user with that email already exists',
            })
            continue
          }

          const password = generateRandomStrongPassword()

          const authUser = await signUpInBetterAuth({
            email: row.email,
            password,
            name: `${row.firstName} ${row.lastName}`,
          })

          const userData: CreateUserInput = {
            id: authUser.id,
            name: `${row.firstName} ${row.middleName ? `${row.middleName} ` : ''}${row.lastName}`,
            firstName: row.firstName,
            middleName: row.middleName,
            lastName: row.lastName,
            email: row.email,
            positions: positionIds,
          }

          const user = await userRepository.create(userData, sessionUser.id)
          await sendWelcomeEmail(authUser.id, password)

          succeeded.push(user)
        } catch (error) {
          failed.push({
            row: rowNumber,
            email: (rows[index] as BulkCreateUserRowInput).email ?? '',
            error: error instanceof Error ? error.message : 'Unexpected error',
          })
        }
      }
    } else {
      const rows = users as BulkUpdateUserRowInput[]
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index]!
        const rowNumber = index + 1

        try {
          if (!row.email || !row.firstName || !row.lastName) {
            failed.push({
              row: rowNumber,
              email: row.email ?? '',
              error: 'Missing required fields: email, firstName, lastName',
            })
            continue
          }

          const existingUser = await userRepository.findByEmail({ email: row.email })
          if (!existingUser) {
            failed.push({
              row: rowNumber,
              email: row.email,
              error: 'No user found with that email',
            })
            continue
          }

          const positionIds = resolvePositionIds(
            row.positionNames ?? [],
            positionNameToId,
            rowNumber
          )
          if (positionIds === null) {
            const unknownNames = (row.positionNames ?? []).filter(
              (n) => !positionNameToId.has(n.toLowerCase())
            )
            failed.push({
              row: rowNumber,
              email: row.email,
              error: `Unknown position(s): ${unknownNames.join(', ')}`,
            })
            continue
          }

          const updateData: UpdateUserInput = {
            id: existingUser.id,
            name: `${row.firstName} ${row.middleName ? `${row.middleName} ` : ''}${row.lastName}`,
            firstName: row.firstName,
            middleName: row.middleName,
            lastName: row.lastName,
            email: row.email,
            positions: positionIds,
          }

          const updatedUser = await userRepository.update(updateData, sessionUser.id)
          succeeded.push(updatedUser)
        } catch (error) {
          failed.push({
            row: rowNumber,
            email: (rows[index] as BulkUpdateUserRowInput).email ?? '',
            error: error instanceof Error ? error.message : 'Unexpected error',
          })
        }
      }
    }

    const result: BulkUserResult = { succeeded, failed }
    return NextResponse.json<APIResponse<BulkUserResult>>(
      { success: true, data: result },
      { status: 200 }
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[POST /api/users/bulk] Unexpected error:', error)

    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
}

function resolvePositionIds(
  positionNames: string[],
  positionNameToId: Map<string, string>,
  _rowNumber: number
): string[] | null {
  const ids: string[] = []
  for (const name of positionNames) {
    const id = positionNameToId.get(name.toLowerCase())
    if (!id) {
      return null
    }
    ids.push(id)
  }
  return ids
}

function generateRandomStrongPassword(length = 14): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const digits = '0123456789'
  const specials = PASSWORD_SPECIAL_CHARACTERS
  const all = `${lower}${upper}${digits}${specials}`

  if (length < 8) {
    throw new Error(PASSWORD_STRENGTH_REQUIREMENTS)
  }

  const required = [
    getRandomCharacter(lower),
    getRandomCharacter(upper),
    getRandomCharacter(digits),
    getRandomCharacter(specials),
  ]

  const remaining = Array.from({ length: length - required.length }, () => getRandomCharacter(all))
  return shuffleArray([...required, ...remaining]).join('')
}

function getRandomCharacter(source: string): string {
  return source.charAt(getRandomInt(source.length))
}

function getRandomInt(maxExclusive: number): number {
  const cryptoObj = globalThis.crypto
  if (cryptoObj?.getRandomValues) {
    const random = new Uint32Array(1)
    cryptoObj.getRandomValues(random)
    return random[0]! % maxExclusive
  }
  return Math.floor(Math.random() * maxExclusive)
}

function shuffleArray<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = getRandomInt(i + 1)
    const temp = result[i]!
    result[i] = result[j]!
    result[j] = temp
  }
  return result
}
