/* eslint-disable no-console */
import {
  DEFAULT_PAGINATION,
  type IPositionRepository,
  type PositionDTO,
  type PositionFilters,
  type PositionSortField,
} from '@herald/types'
import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  type Firestore,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  Query,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'

import { createPaginatedResult } from '../../dto.ts'

const MAX_PAGE_LIMIT = 10
const DEFAULT_SORT_FIELD: PositionSortField = 'createdAt'
const DEFAULT_SORT_DIRECTION = 'desc'

export function createPositionRepositoryGateway(firestore: Firestore): IPositionRepository {
  const POSITIONS_COLLECTION = 'positions'
  const USERS_COLLECTION = 'users'

  return {
    async findById({ id }) {
      try {
        const validatedId = validatePositionId(id)
        const docRef = doc(firestore, POSITIONS_COLLECTION, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          return null
        }

        const userCount = await getPositionUserCount(firestore, USERS_COLLECTION, validatedId)
        return mapPositionDocToDTO(validatedId, docSnap.data(), userCount)
      } catch (error) {
        console.error('Error in findById:', error)
        throw error
      }
    },

    async findAll(params) {
      try {
        const { page, limit: pageLimit } = normalizePagination(params.pagination)
        const sortField = validateSortField(params.sort?.field)
        const sortDirection = validateSortDirection(params.sort?.direction)

        const baseQuery = buildPositionsQuery(
          firestore,
          POSITIONS_COLLECTION,
          params.filters,
          sortField,
          sortDirection
        )

        const totalSnapshot = await getCountFromServer(baseQuery)
        const total = totalSnapshot.data().count

        const positions = await fetchPaginatedPositions(baseQuery, page, pageLimit)

        const positionsWithUserCount = await Promise.all(
          positions.map(async (position) => ({
            ...position,
            userCount: await getPositionUserCount(firestore, USERS_COLLECTION, position.id),
          }))
        )

        return createPaginatedResult(positionsWithUserCount, total, {
          page,
          limit: pageLimit,
        })
      } catch (error) {
        console.error('Error finding all positions:', error)
        throw error
      }
    },

    async create(position) {
      try {
        const { name, abbreviation, permissions } = position

        const trimmedName = name.trim()
        const trimmedAbbreviation = abbreviation.trim()

        if (!trimmedName) {
          throw new TypeError('Invalid input: Position name is required')
        }

        if (!trimmedAbbreviation) {
          throw new TypeError('Invalid input: Position abbreviation is required')
        }

        if (!Array.isArray(permissions)) {
          throw new TypeError('Invalid input: "permissions" must be an array of strings')
        }

        const now = Timestamp.now()

        const positionDoc = {
          name: trimmedName,
          abbreviation: trimmedAbbreviation,
          permissions,
          createdAt: now,
          updatedAt: now,
        }

        const docRef = doc(collection(firestore, POSITIONS_COLLECTION))
        await setDoc(docRef, positionDoc)

        return mapPositionDocToDTO(docRef.id, positionDoc, 0)
      } catch (error) {
        console.error('Error creating position:', error)
        throw error
      }
    },

    async update(position) {
      try {
        const validatedId = validatePositionId(position.id)
        const docRef = doc(firestore, POSITIONS_COLLECTION, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          throw new Error(`Position with id ${validatedId} does not exist`)
        }

        const now = Timestamp.now()
        const updateData = {
          name: position.name.trim(),
          abbreviation: position.abbreviation.trim(),
          permissions: position.permissions,
          updatedAt: now,
        }

        await updateDoc(docRef, updateData)

        const updatedDocSnap = await getDoc(docRef)
        if (!updatedDocSnap.exists()) {
          throw new Error(`Position with id ${validatedId} was not found after update`)
        }

        const userCount = await getPositionUserCount(firestore, USERS_COLLECTION, validatedId)
        return mapPositionDocToDTO(validatedId, updatedDocSnap.data()!, userCount)
      } catch (error) {
        console.error('Error updating position:', error)
        throw error
      }
    },

    async delete(id) {
      try {
        const validatedId = validatePositionId(id)
        const docRef = doc(firestore, POSITIONS_COLLECTION, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          throw new Error(`Position with id ${validatedId} does not exist`)
        }

        await deleteDoc(docRef)

        // Optionally, also remove this position from the positionsId array of any users that have it assigned
        const usersWithPositionQuery = query(
          collection(firestore, 'users'),
          where('positionIds', 'array-contains', validatedId)
        )
        const usersSnapshot = await getDocs(usersWithPositionQuery)
        const batch = writeBatch(firestore)
        usersSnapshot.forEach((userDoc) => {
          const userRef = doc(firestore, 'users', userDoc.id)
          batch.update(userRef, {
            positionIds: userDoc.data().positionIds.filter((pid: string) => pid !== validatedId),
          })
        })
        await batch.commit()
      } catch (error) {
        console.error('Error deleting position:', error)
        throw error
      }
    },

    async exists(id) {
      try {
        const validatedId = validatePositionId(id)

        const docRef = doc(firestore, POSITIONS_COLLECTION, validatedId)
        const docSnap = await getDoc(docRef)
        return docSnap.exists()
      } catch (error) {
        console.error('Error checking if position exists:', error)
        throw error
      }
    },

    async getTotalCount() {
      try {
        const collectionRef = collection(firestore, POSITIONS_COLLECTION)
        const snapshot = await getCountFromServer(collectionRef)
        return { totalPositions: snapshot.data().count }
      } catch (error) {
        console.error('Error getting total position count:', error)
        throw error
      }
    },
  }
}

function validateSortField(field: unknown): PositionSortField {
  const sortField = typeof field === 'string' ? field.trim() : DEFAULT_SORT_FIELD
  const allowedFields: PositionSortField[] = ['name', 'createdAt', 'updatedAt']

  if (!allowedFields.includes(sortField as PositionSortField)) {
    return DEFAULT_SORT_FIELD
  }

  return sortField as PositionSortField
}

function validateSortDirection(direction: unknown): 'asc' | 'desc' {
  return direction === 'asc' ? 'asc' : DEFAULT_SORT_DIRECTION
}

function buildPositionsQuery(
  firestore: Firestore,
  collectionName: string,
  filters: PositionFilters | undefined,
  sortField: PositionSortField,
  sortDirection: 'asc' | 'desc'
): Query<DocumentData> {
  const constraints: QueryConstraint[] = []
  const positionsRef = collection(firestore, collectionName)

  if (Array.isArray(filters?.permissions) && filters.permissions.length > 0) {
    if (filters.permissions.length === 1) {
      constraints.push(where('permissions', 'array-contains', filters.permissions[0]))
    } else {
      constraints.push(where('permissions', 'array-contains-any', filters.permissions.slice(0, 10)))
    }
  }

  constraints.push(orderBy(sortField, sortDirection))
  return query(positionsRef, ...constraints)
}

async function fetchPaginatedPositions(
  baseQuery: Query<DocumentData>,
  page: number,
  pageLimit: number
): Promise<PositionDTO[]> {
  if (page === 1) {
    const snapshot = await getDocs(query(baseQuery, limit(pageLimit)))
    return snapshot.docs.map((docSnap) => mapPositionDocToDTO(docSnap.id, docSnap.data()))
  }

  const cursor = await getPageCursor(baseQuery, page, pageLimit)
  if (!cursor) {
    return []
  }

  const pageQuery = query(baseQuery, startAfter(cursor), limit(pageLimit))
  const snapshot = await getDocs(pageQuery)
  return snapshot.docs.map((docSnap) => mapPositionDocToDTO(docSnap.id, docSnap.data()))
}

async function getPageCursor(
  baseQuery: Query<DocumentData>,
  page: number,
  pageLimit: number
): Promise<QueryDocumentSnapshot<DocumentData> | undefined> {
  let cursor: QueryDocumentSnapshot<DocumentData> | undefined
  let remaining = (page - 1) * pageLimit

  while (remaining > 0) {
    const step = Math.min(pageLimit, remaining)
    const cursorQuery = cursor
      ? query(baseQuery, startAfter(cursor), limit(step))
      : query(baseQuery, limit(step))

    const snapshot = await getDocs(cursorQuery)
    if (snapshot.empty) {
      return undefined
    }

    cursor = snapshot.docs[snapshot.docs.length - 1]
    remaining -= snapshot.docs.length

    if (snapshot.docs.length < step) {
      return undefined
    }
  }

  return cursor
}

function normalizePagination(pagination: { page?: unknown; limit?: unknown }): {
  page: number
  limit: number
} {
  const parsedPage = Number(pagination?.page)
  const page = Number.isFinite(parsedPage)
    ? Math.max(1, Math.floor(parsedPage))
    : DEFAULT_PAGINATION.page

  const parsedLimit = Number(pagination?.limit)
  const normalizedLimit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.floor(parsedLimit))
    : DEFAULT_PAGINATION.limit

  return {
    page,
    limit: Math.min(MAX_PAGE_LIMIT, normalizedLimit),
  }
}

function mapPositionDocToDTO(id: string, docSnap: DocumentData, userCount = 0): PositionDTO {
  const name = requireStringField(docSnap, 'name', id)
  const abbreviation = requireStringField(docSnap, 'abbreviation', id)
  const permissions = requirePermissionsField(docSnap, id)
  const createdAt = requireTimestampField(docSnap, 'createdAt', id)
  const updatedAt = requireTimestampField(docSnap, 'updatedAt', id)

  return {
    id,
    name,
    abbreviation,
    permissions,
    createdAt,
    updatedAt,
    userCount,
  }
}

async function getPositionUserCount(
  firestore: Firestore,
  usersCollection: string,
  positionId: string
): Promise<number> {
  const usersWithPositionQuery = query(
    collection(firestore, usersCollection),
    where('positionIds', 'array-contains', positionId)
  )
  const usersCountSnapshot = await getCountFromServer(usersWithPositionQuery)
  return usersCountSnapshot.data().count
}

function requireStringField(docSnap: DocumentData, field: string, positionId: string): string {
  const value = docSnap?.[field]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `Invalid or missing required position field "${field}" for position ${positionId}`
    )
  }

  return value
}

function requirePermissionsField(
  docSnap: DocumentData,
  positionId: string
): PositionDTO['permissions'] {
  const permissions = docSnap?.permissions
  if (!Array.isArray(permissions)) {
    throw new Error(
      `Invalid or missing required position field "permissions" for position ${positionId}`
    )
  }

  return permissions as PositionDTO['permissions']
}

function requireTimestampField(docSnap: DocumentData, field: string, positionId: string): string {
  const value = docSnap?.[field]
  if (!(value instanceof Timestamp)) {
    throw new Error(
      `Invalid or missing required position field "${field}" for position ${positionId}`
    )
  }

  return value.toDate().toISOString()
}

function validatePositionId(id: unknown): string {
  if (typeof id !== 'string') {
    throw new TypeError('Invalid findById input: "id" must be a string')
  }

  const normalizedId = id.trim()
  if (normalizedId.length === 0) {
    throw new TypeError('Invalid findById input: "id" cannot be empty')
  }

  if (normalizedId.includes('/')) {
    throw new TypeError('Invalid findById input: "id" cannot contain "/"')
  }

  return normalizedId
}
