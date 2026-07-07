/* eslint-disable no-console */
import {
  DEFAULT_PAGINATION,
  type Domain,
  type IPositionRepository,
  type Position,
  type PositionDTO,
  type PositionFilters,
  type PositionSortField,
} from '@herald/types'
import type { AuditLogTargetSnapshot } from '@herald/types/auditLog'
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
import type {
  DocumentData as AdminDocumentData,
  Firestore as AdminFirestore,
} from 'firebase-admin/firestore'

import { createAuditLogService } from '../../audit-log/index.ts'
import { isValidDomain } from '../../constants.ts'
import { createPaginatedResult } from '../../dto.ts'

const MAX_PAGE_LIMIT = 10
const DEFAULT_SORT_FIELD: PositionSortField = 'createdAt'
const DEFAULT_SORT_DIRECTION = 'desc'
const POSITIONS_COLLECTION = 'positions'

// Admin-SDK counterpart used by services running outside the browser (e.g.
// apps/auth's session/login hydration), where only a firebase-admin Firestore
// instance is available rather than the client SDK.
export async function getPositionsByIdsAdmin(
  firestore: AdminFirestore,
  ids: string[]
): Promise<Position[]> {
  const uniqueIds = [...new Set(ids)]
  if (uniqueIds.length === 0) {
    return []
  }

  const snapshots = await Promise.all(
    uniqueIds.map((id) => firestore.collection(POSITIONS_COLLECTION).doc(id).get())
  )

  return snapshots
    .filter((snap) => snap.exists)
    .map((snap) => mapAdminPositionDocToPosition(snap.id, snap.data()!))
}

function mapAdminPositionDocToPosition(id: string, data: AdminDocumentData): Position {
  return {
    id,
    name: typeof data.name === 'string' ? data.name : '',
    abbreviation: typeof data.abbreviation === 'string' ? data.abbreviation : '',
    domains: Array.isArray(data.domains) ? (data.domains as Domain[]) : [],
    createdAt:
      typeof data.createdAt?.toDate === 'function' ? data.createdAt.toDate().toISOString() : '',
    updatedAt:
      typeof data.updatedAt?.toDate === 'function' ? data.updatedAt.toDate().toISOString() : '',
  }
}

export function createFirebasePositionRepository(firestore: Firestore): IPositionRepository {
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

    async create(position, performedById) {
      try {
        const { name, abbreviation, domains } = position

        const trimmedName = name.trim()
        const trimmedAbbreviation = abbreviation.trim()

        if (!trimmedName) {
          throw new TypeError('Invalid input: Position name is required')
        }

        if (!trimmedAbbreviation) {
          throw new TypeError('Invalid input: Position abbreviation is required')
        }

        if (!Array.isArray(domains) || !domains.every(isValidDomain)) {
          throw new TypeError('Invalid input: "domains" must be an array of valid Domain values')
        }

        const now = Timestamp.now()

        const positionDoc = {
          name: trimmedName,
          abbreviation: trimmedAbbreviation,
          domains,
          createdAt: now,
          updatedAt: now,
        }

        const docRef = doc(collection(firestore, POSITIONS_COLLECTION))
        await setDoc(docRef, positionDoc)

        const targetSnapshot: AuditLogTargetSnapshot = {
          type: 'position',
          data: {
            id: docRef.id,
            name: trimmedName,
            abbreviation: trimmedAbbreviation,
            domains,
            createdAt: now.toDate().toISOString(),
          },
        }
        createAuditLogService(firestore).log('POSITION_CREATED', targetSnapshot, performedById)

        return mapPositionDocToDTO(docRef.id, positionDoc, 0)
      } catch (error) {
        console.error('Error creating position:', error)
        throw error
      }
    },

    async update(position, performedById) {
      try {
        const validatedId = validatePositionId(position.id)
        const docRef = doc(firestore, POSITIONS_COLLECTION, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          throw new Error(`Position with id ${validatedId} does not exist`)
        }

        const trimmedName = position.name.trim()
        const trimmedAbbreviation = position.abbreviation.trim()
        const now = Timestamp.now()
        const previousDomains = Array.isArray(docSnap.data().domains)
          ? (docSnap.data().domains as string[])
          : []
        const domainsChanged =
          previousDomains.length !== position.domains.length ||
          !previousDomains.every((domain) => position.domains.includes(domain as Domain))
        const updateData = {
          name: trimmedName,
          abbreviation: trimmedAbbreviation,
          domains: position.domains,
          updatedAt: now,
        }

        await updateDoc(docRef, updateData)

        const updatedDocSnap = await getDoc(docRef)
        if (!updatedDocSnap.exists()) {
          throw new Error(`Position with id ${validatedId} was not found after update`)
        }

        const targetSnapshot: AuditLogTargetSnapshot = {
          type: 'position',
          data: {
            id: validatedId,
            name: trimmedName,
            abbreviation: trimmedAbbreviation,
            domains: position.domains,
            createdAt:
              docSnap.data().createdAt instanceof Timestamp
                ? docSnap.data().createdAt.toDate().toISOString()
                : '',
          },
        }
        createAuditLogService(firestore).log(
          domainsChanged ? 'POSITION_DOMAINS_CHANGED' : 'POSITION_UPDATED',
          targetSnapshot,
          performedById
        )

        const userCount = await getPositionUserCount(firestore, USERS_COLLECTION, validatedId)
        return mapPositionDocToDTO(validatedId, updatedDocSnap.data()!, userCount)
      } catch (error) {
        console.error('Error updating position:', error)
        throw error
      }
    },

    async delete(input, performedById) {
      try {
        const validatedId = validatePositionId(input.id)
        const docRef = doc(firestore, POSITIONS_COLLECTION, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          throw new Error(`Position with id ${validatedId} does not exist`)
        }

        const data = docSnap.data()
        const targetSnapshot: AuditLogTargetSnapshot = {
          type: 'position',
          data: {
            id: validatedId,
            name: typeof data.name === 'string' ? data.name : '',
            abbreviation: typeof data.abbreviation === 'string' ? data.abbreviation : '',
            domains: Array.isArray(data.domains) ? (data.domains as Domain[]) : [],
            createdAt:
              data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : '',
          },
        }

        await deleteDoc(docRef)
        createAuditLogService(firestore).log('POSITION_DELETED', targetSnapshot, performedById)

        // Remove this position from the positions array of any users that have it assigned
        const usersWithPositionQuery = query(
          collection(firestore, 'users'),
          where('positions', 'array-contains', validatedId)
        )
        const usersSnapshot = await getDocs(usersWithPositionQuery)
        const batch = writeBatch(firestore)
        usersSnapshot.forEach((userDoc) => {
          const userRef = doc(firestore, 'users', userDoc.id)
          batch.update(userRef, {
            positions: userDoc.data().positions.filter((pid: string) => pid !== validatedId),
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

  if (Array.isArray(filters?.domains) && filters.domains.length > 0) {
    if (filters.domains.length === 1) {
      constraints.push(where('domains', 'array-contains', filters.domains[0]))
    } else {
      constraints.push(where('domains', 'array-contains-any', filters.domains.slice(0, 10)))
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
  const domains = requireDomainsField(docSnap, id)
  const createdAt = requireTimestampField(docSnap, 'createdAt', id)
  const updatedAt = requireTimestampField(docSnap, 'updatedAt', id)

  return {
    id,
    name,
    abbreviation,
    domains,
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
    where('positions', 'array-contains', positionId)
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

function requireDomainsField(docSnap: DocumentData, positionId: string): PositionDTO['domains'] {
  const domains = docSnap?.domains
  if (!Array.isArray(domains) || !domains.every(isValidDomain)) {
    throw new Error(
      `Invalid or missing required position field "domains" for position ${positionId}`
    )
  }

  return domains
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
