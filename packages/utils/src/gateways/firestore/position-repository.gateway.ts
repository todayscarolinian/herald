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
import type { DocumentData, Firestore, Query, WriteBatch } from 'firebase-admin/firestore'
import { Timestamp } from 'firebase-admin/firestore'

import { createAdminAuditLogService } from '../../audit-log/index.ts'
import { isValidDomain } from '../../constants.ts'
import { createPaginatedResult } from '../../dto.ts'
import { fetchPaginatedDocs } from './pagination.ts'

const DEFAULT_SORT_FIELD: PositionSortField = 'createdAt'
const DEFAULT_SORT_DIRECTION = 'desc'
const POSITIONS_COLLECTION = 'positions'

// Lightweight lookup used by services running outside the full repository
// (e.g. apps/auth's session hydration), which only need bare Position data
// for a known set of IDs rather than the full IPositionRepository contract.
export async function getPositionsByIdsAdmin(
  firestore: Firestore,
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

function mapAdminPositionDocToPosition(id: string, data: DocumentData): Position {
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
        const docRef = firestore.collection(POSITIONS_COLLECTION).doc(validatedId)
        const docSnap = await docRef.get()

        if (!docSnap.exists) {
          return null
        }

        const userCount = await getPositionUserCount(firestore, USERS_COLLECTION, validatedId)
        return mapPositionDocToDTO(validatedId, docSnap.data()!, userCount)
      } catch (error) {
        console.error('Error in findById:', error)
        throw error
      }
    },

    async findAll(params) {
      try {
        const { page, limit: pageLimit } = normalizePagination(params.pagination)
        const search = normalizeSearchTerm(params.filters?.search)
        const sortField = validateSortField(params.sort?.field)
        const sortDirection = validateSortDirection(params.sort?.direction)

        const baseQuery = buildPositionsQuery(
          firestore,
          POSITIONS_COLLECTION,
          params.filters,
          sortField,
          sortDirection
        )

        if (search) {
          const { positions, total } = await fetchSearchPositions(
            baseQuery,
            search,
            page,
            pageLimit
          )

          const positionsWithUserCount = await Promise.all(
            positions.map(async (position) => ({
              ...position,
              userCount: await getPositionUserCount(firestore, USERS_COLLECTION, position.id),
            }))
          )

          return createPaginatedResult(positionsWithUserCount, total, { page, limit: pageLimit })
        }

        const totalSnapshot = await baseQuery.count().get()
        const total = totalSnapshot.data().count

        const positions = await fetchPaginatedPositions(baseQuery, page, pageLimit)

        const positionsWithUserCount = await Promise.all(
          positions.map(async (position) => ({
            ...position,
            userCount: await getPositionUserCount(firestore, USERS_COLLECTION, position.id),
          }))
        )

        return createPaginatedResult(positionsWithUserCount, total, { page, limit: pageLimit })
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

        const docRef = firestore.collection(POSITIONS_COLLECTION).doc()
        await docRef.set(positionDoc)

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
        createAdminAuditLogService(firestore).log('POSITION_CREATED', targetSnapshot, performedById)

        return mapPositionDocToDTO(docRef.id, positionDoc, 0)
      } catch (error) {
        console.error('Error creating position:', error)
        throw error
      }
    },

    async update(position, performedById) {
      try {
        const validatedId = validatePositionId(position.id)
        const docRef = firestore.collection(POSITIONS_COLLECTION).doc(validatedId)
        const docSnap = await docRef.get()

        if (!docSnap.exists) {
          throw new Error(`Position with id ${validatedId} does not exist`)
        }

        const trimmedName = position.name.trim()
        const trimmedAbbreviation = position.abbreviation.trim()
        const now = Timestamp.now()
        const previousDomains = Array.isArray(docSnap.data()?.domains)
          ? (docSnap.data()?.domains as string[])
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

        await docRef.update(updateData)

        const updatedDocSnap = await docRef.get()
        if (!updatedDocSnap.exists) {
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
              docSnap.data()?.createdAt instanceof Timestamp
                ? docSnap.data()!.createdAt.toDate().toISOString()
                : '',
          },
        }
        createAdminAuditLogService(firestore).log(
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
        const docRef = firestore.collection(POSITIONS_COLLECTION).doc(validatedId)
        const docSnap = await docRef.get()

        if (!docSnap.exists) {
          throw new Error(`Position with id ${validatedId} does not exist`)
        }

        const data = docSnap.data()!
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

        await docRef.delete()
        createAdminAuditLogService(firestore).log('POSITION_DELETED', targetSnapshot, performedById)

        // Remove this position from the positions array of any users that have it assigned
        const usersSnapshot = await firestore
          .collection('users')
          .where('positions', 'array-contains', validatedId)
          .get()
        const batch: WriteBatch = firestore.batch()
        usersSnapshot.forEach((userDoc) => {
          batch.update(userDoc.ref, {
            positions: (userDoc.data().positions as string[]).filter((pid) => pid !== validatedId),
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

        const docSnap = await firestore.collection(POSITIONS_COLLECTION).doc(validatedId).get()
        return docSnap.exists
      } catch (error) {
        console.error('Error checking if position exists:', error)
        throw error
      }
    },

    async getTotalCount() {
      try {
        const snapshot = await firestore.collection(POSITIONS_COLLECTION).count().get()
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
  let positionsQuery: Query<DocumentData> = firestore.collection(collectionName)

  if (Array.isArray(filters?.domains) && filters.domains.length > 0) {
    if (filters.domains.length === 1) {
      positionsQuery = positionsQuery.where('domains', 'array-contains', filters.domains[0])
    } else {
      positionsQuery = positionsQuery.where(
        'domains',
        'array-contains-any',
        filters.domains.slice(0, 10)
      )
    }
  }

  return positionsQuery.orderBy(sortField, sortDirection)
}

async function fetchPaginatedPositions(
  baseQuery: Query<DocumentData>,
  page: number,
  pageLimit: number
): Promise<PositionDTO[]> {
  const docs = await fetchPaginatedDocs(baseQuery, page, pageLimit)
  return docs.map((docSnap) => mapPositionDocToDTO(docSnap.id, docSnap.data()))
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
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.floor(parsedLimit))
    : DEFAULT_PAGINATION.limit

  return { page, limit }
}

function normalizeSearchTerm(search: unknown): string | undefined {
  if (typeof search !== 'string') {
    return undefined
  }

  const normalizedSearch = search.trim().toLowerCase()
  return normalizedSearch.length > 0 ? normalizedSearch : undefined
}

async function fetchSearchPositions(
  baseQuery: Query<DocumentData>,
  search: string,
  page: number,
  pageLimit: number
): Promise<{ positions: PositionDTO[]; total: number }> {
  const snapshot = await baseQuery.get()
  const matching = snapshot.docs
    .map((docSnap) => mapPositionDocToDTO(docSnap.id, docSnap.data()))
    .filter((position) => matchesSearch(position, search))

  const startIndex = (page - 1) * pageLimit
  const positions = matching.slice(startIndex, startIndex + pageLimit)

  return { positions, total: matching.length }
}

function matchesSearch(position: PositionDTO, search: string): boolean {
  return (
    position.name.toLowerCase().includes(search) ||
    position.abbreviation.toLowerCase().includes(search)
  )
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
  const snapshot = await firestore
    .collection(usersCollection)
    .where('positions', 'array-contains', positionId)
    .count()
    .get()
  return snapshot.data().count
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
