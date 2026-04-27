/* eslint-disable no-console */
import {
  DEFAULT_PAGINATION,
  type IPermissionRepository,
  type PermissionDTO,
  type PermissionFilters,
  type PermissionSortField,
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
  type Query,
  query,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { createPaginatedResult } from '../../dto.ts'

const MAX_PAGE_LIMIT = 10
const DEFAULT_SORT_FIELD: PermissionSortField = 'createdAt'
const DEFAULT_SORT_DIRECTION = 'desc'

export function createFirebasePermissionRepository(firestore: Firestore): IPermissionRepository {
  const COLLECTION_NAME = 'permissions'

  return {
    async findById({ id }) {
      try {
        const validatedId = validatePermissionId(id)
        const docRef = doc(firestore, COLLECTION_NAME, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          return null
        }

        return mapPermissionDocToDTO(docSnap.id, docSnap.data())
      } catch (error) {
        console.error('Error finding permission by ID:', error)
        throw error
      }
    },

    async findAll(params) {
      try {
        const { page, limit: pageLimit } = normalizePagination(params.pagination)
        const sortField = validateSortField(params.sort?.field)
        const sortDirection = validateSortDirection(params.sort?.direction)

        const baseQuery = buildPermissionQuery(
          firestore,
          COLLECTION_NAME,
          params.filters,
          sortField,
          sortDirection
        )

        const totalSnapshot = await getCountFromServer(baseQuery)
        const total = totalSnapshot.data().count

        const permissions = await fetchPaginatedPermissions(baseQuery, page, pageLimit)

        return createPaginatedResult(permissions, total, {
          page,
          limit: pageLimit,
        })
      } catch (error) {
        console.error('Error finding all permissions:', error)
        throw error
      }
    },

    async create(params) {
      try {
        const { name, domain, description } = params

        const trimmedName = name?.trim()
        const trimmedDomain = domain?.trim()
        const trimmedDescription = description?.trim()

        if (!trimmedName) {
          throw new TypeError('Invalid input: "name" is required')
        }

        if (!trimmedDomain) {
          throw new TypeError('Invalid input: "domain" is required')
        }

        if (!trimmedDescription) {
          throw new TypeError('Invalid input: "description" is required')
        }

        const now = Timestamp.now()

        const permissionDoc = {
          name: trimmedName,
          domain: trimmedDomain,
          description: trimmedDescription,
          createdAt: now,
          updatedAt: now,
        }

        const docRef = doc(collection(firestore, COLLECTION_NAME))
        await setDoc(docRef, permissionDoc)

        return mapPermissionDocToDTO(docRef.id, permissionDoc)
      } catch (error) {
        console.error('Error creating permission:', error)
        throw error
      }
    },

    async update(permission) {
      try {
        const validatedId = validatePermissionId(permission.id)
        const docRef = doc(firestore, COLLECTION_NAME, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          throw new Error(`Permission with ID "${validatedId}" not found`)
        }

        const now = Timestamp.now()
        const updateData = {
          name: permission.name,
          domain: permission.domain,
          description: permission.description,
          updatedAt: now,
        }

        await updateDoc(docRef, updateData)

        const updatedSnap = await getDoc(docRef)
        if (!updatedSnap.exists()) {
          throw new Error(`Permission with ID "${validatedId}" not found after update`)
        }

        return mapPermissionDocToDTO(updatedSnap.id, updatedSnap.data())
      } catch (error) {
        console.error('Error updating permission:', error)
        throw error
      }
    },

    async delete(params) {
      try {
        const validatedId = validatePermissionId(params.id)
        const docRef = doc(firestore, COLLECTION_NAME, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          throw new Error(`Permission with ID "${validatedId}" not found`)
        }

        await deleteDoc(docRef)

        // Optionally, remove references to this permission in positions collection (wait for INTEG-9 to be implemented)
      } catch (error) {
        console.error('Error deleting permission:', error)
        throw error
      }
    },

    async getTotalCount() {
      try {
        const permissionsRef = collection(firestore, COLLECTION_NAME)
        const snapshot = await getCountFromServer(permissionsRef)
        return { totalPermissions: snapshot.data().count }
      } catch (error) {
        console.error('Error getting total permission count:', error)
        throw error
      }
    },

    async getPermissionPositionDistribution() {
      throw new Error('Not implemented: getPermissionPositionDistribution') // wait for INTEG-9 to be implemented before implementing this method
    },

    async exists(id) {
      try {
        const validatedId = validatePermissionId(id)

        const docRef = doc(firestore, COLLECTION_NAME, validatedId)
        const docSnap = await getDoc(docRef)
        return docSnap.exists()
      } catch (error) {
        console.error('Error checking if permission exists:', error)
        throw error
      }
    },
  }
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

function validateSortField(field: unknown): PermissionSortField {
  const sortField = typeof field === 'string' ? field.trim() : DEFAULT_SORT_FIELD
  const allowedFields: PermissionSortField[] = ['name', 'domain', 'createdAt', 'updatedAt']

  if (!allowedFields.includes(sortField as PermissionSortField)) {
    return DEFAULT_SORT_FIELD
  }

  return sortField as PermissionSortField
}

function validateSortDirection(direction: unknown): 'asc' | 'desc' {
  return direction === 'asc' ? 'asc' : DEFAULT_SORT_DIRECTION
}

function buildPermissionQuery(
  firestore: Firestore,
  collectionName: string,
  filters: PermissionFilters | undefined,
  sortField: PermissionSortField,
  sortDirection: 'asc' | 'desc'
): Query<DocumentData> {
  const constraints: QueryConstraint[] = []
  const permissionsRef = collection(firestore, collectionName)

  if (typeof filters?.domain === 'string') {
    constraints.push(where('domain', '==', filters.domain))
  }

  constraints.push(orderBy(sortField, sortDirection))
  return query(permissionsRef, ...constraints)
}

async function fetchPaginatedPermissions(
  baseQuery: Query<DocumentData>,
  page: number,
  pageLimit: number
): Promise<PermissionDTO[]> {
  if (page === 1) {
    const snapshot = await getDocs(query(baseQuery, limit(pageLimit)))
    return snapshot.docs.map((docSnap) => mapPermissionDocToDTO(docSnap.id, docSnap.data()))
  }

  const cursor = await getPageCursor(baseQuery, page, pageLimit)
  if (!cursor) {
    return []
  }

  const pageQuery = query(baseQuery, startAfter(cursor), limit(pageLimit))
  const snapshot = await getDocs(pageQuery)
  return snapshot.docs.map((docSnap) => mapPermissionDocToDTO(docSnap.id, docSnap.data()))
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

function mapPermissionDocToDTO(id: string, docSnap: DocumentData): PermissionDTO {
  const name = requireStringField(docSnap, 'name', id)
  const domain = requireStringField(docSnap, 'domain', id)
  const description = requireStringField(docSnap, 'description', id)
  const createdAt = requireTimestampField(docSnap, 'createdAt', id)
  const updatedAt = requireTimestampField(docSnap, 'updatedAt', id)

  return {
    id,
    name,
    domain,
    description,
    createdAt,
    updatedAt,
  }
}

function requireStringField(docSnap: DocumentData, field: string, permissionId: string): string {
  const value = docSnap?.[field]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `Invalid or missing required permission field "${field}" for permission ${permissionId}`
    )
  }

  return value
}

function requireTimestampField(docSnap: DocumentData, field: string, permissionId: string): string {
  const value = docSnap?.[field]
  if (!(value instanceof Timestamp)) {
    throw new Error(
      `Invalid or missing required permission field "${field}" for permission ${permissionId}`
    )
  }

  return value.toDate().toISOString()
}

function validatePermissionId(id: unknown): string {
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
