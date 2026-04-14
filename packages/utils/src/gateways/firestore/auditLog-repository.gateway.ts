/* eslint-disable no-console */
import {
  type AuditLogDTO,
  AuditLogFilters,
  AuditLogSortField,
  DEFAULT_PAGINATION,
  type IAuditLogRepository,
} from '@herald/types'
import {
  collection,
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
  where,
} from 'firebase/firestore'

import { createPaginatedResult } from '../../dto.ts'

const MAX_PAGE_LIMIT = 10
const DEFAULT_SORT_FIELD: AuditLogSortField = 'timestamp'
const DEFAULT_SORT_DIRECTION = 'desc'

export function createFirebaseAuditLogRepository(firestore: Firestore): IAuditLogRepository {
  const COLLECTION_NAME = 'auditLogs'

  return {
    async findById({ id }) {
      try {
        const validatedId = validateAuditLogId(id)
        const docRef = doc(firestore, COLLECTION_NAME, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          return null
        }

        return mapAuditLogDocToDTO(docSnap.id, docSnap.data())
      } catch (error) {
        console.error('Error finding audit log by ID:', error)
        throw error
      }
    },

    async findAll(params) {
      try {
        const { page, limit: pageLimit } = normalizePagination(params.pagination)
        const sortField = validateSortField(params.sort?.field)
        const sortDirection = validateSortDirection(params.sort?.direction)

        const baseQuery = buildAuditLogQuery(
          firestore,
          COLLECTION_NAME,
          params.filters,
          sortField,
          sortDirection
        )

        const totalSnapshot = await getCountFromServer(baseQuery)
        const total = totalSnapshot.data().count

        const auditLogs = await fetchPaginatedAuditLogs(baseQuery, page, pageLimit)

        return createPaginatedResult(auditLogs, total, {
          page,
          limit: pageLimit,
        })
      } catch (error) {
        console.error('Error finding all audit logs:', error)
        throw error
      }
    },

    async create(params) {
      try {
        const { action, targetId, performerId } = params

        const trimmedAction = action?.trim()

        if (!trimmedAction) {
          throw new TypeError('Invalid input: "action" is required')
        }

        if (typeof targetId !== 'string' || targetId.trim().length === 0) {
          throw new TypeError(
            'Invalid input: "targetId" is required and must be a non-empty string'
          )
        }

        if (typeof performerId !== 'string' || performerId.trim().length === 0) {
          throw new TypeError(
            'Invalid input: "performerId" is required and must be a non-empty string'
          )
        }

        const now = Timestamp.now()

        const auditLogDoc = {
          action: trimmedAction,
          targetId: targetId.trim(),
          performerId: performerId.trim(),
          timestamp: now,
        }

        const docRef = doc(collection(firestore, COLLECTION_NAME))

        await setDoc(docRef, auditLogDoc)

        return mapAuditLogDocToDTO(docRef.id, auditLogDoc)
      } catch (error) {
        console.error('Error creating audit log:', error)
        throw error
      }
    },

    async getTotalCount() {
      try {
        const auditLogsRef = collection(firestore, COLLECTION_NAME)
        const snapshot = await getCountFromServer(auditLogsRef)
        return { totalAuditLogs: snapshot.data().count }
      } catch (error) {
        console.error('Error getting total audit log count:', error)
        throw error
      }
    },

    async exists(id) {
      try {
        const validatedId = validateAuditLogId(id)

        const docRef = doc(firestore, COLLECTION_NAME, validatedId)
        const docSnap = await getDoc(docRef)
        return docSnap.exists()
      } catch (error) {
        console.error('Error checking if audit log exists:', error)
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

function validateSortField(field: unknown): AuditLogSortField {
  const sortField = typeof field === 'string' ? field.trim() : DEFAULT_SORT_FIELD
  const allowedFields: AuditLogSortField[] = ['action', 'targetId', 'performerId', 'timestamp']

  if (!allowedFields.includes(sortField as AuditLogSortField)) {
    return DEFAULT_SORT_FIELD
  }

  return sortField as AuditLogSortField
}

function validateSortDirection(direction: unknown): 'asc' | 'desc' {
  return direction === 'asc' ? 'asc' : DEFAULT_SORT_DIRECTION
}

function buildAuditLogQuery(
  firestore: Firestore,
  collectionName: string,
  filters: AuditLogFilters | undefined,
  sortField: AuditLogSortField,
  sortDirection: 'asc' | 'desc'
): Query<DocumentData> {
  const constraints: QueryConstraint[] = []
  const auditLogsRef = collection(firestore, collectionName)

  if (filters?.action) {
    constraints.push(where('action', '==', filters.action.trim()))
  }

  if (filters?.targetId) {
    constraints.push(where('targetId', '==', filters.targetId.trim()))
  }

  if (filters?.performerId) {
    constraints.push(where('performerId', '==', filters.performerId.trim()))
  }

  constraints.push(orderBy(sortField, sortDirection))
  return query(auditLogsRef, ...constraints)
}

async function fetchPaginatedAuditLogs(
  baseQuery: Query<DocumentData>,
  page: number,
  pageLimit: number
): Promise<AuditLogDTO[]> {
  if (page === 1) {
    const snapshot = await getDocs(query(baseQuery, limit(pageLimit)))
    return snapshot.docs.map((docSnap) => mapAuditLogDocToDTO(docSnap.id, docSnap.data()))
  }

  const cursor = await getPageCursor(baseQuery, page, pageLimit)
  if (!cursor) {
    return []
  }

  const pageQuery = query(baseQuery, startAfter(cursor), limit(pageLimit))
  const snapshot = await getDocs(pageQuery)
  return snapshot.docs.map((docSnap) => mapAuditLogDocToDTO(docSnap.id, docSnap.data()))
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

function mapAuditLogDocToDTO(id: string, docSnap: DocumentData): AuditLogDTO {
  const action = requireStringField(docSnap, 'action', id)
  const targetId = requireStringField(docSnap, 'targetId', id)
  const performerId = requireStringField(docSnap, 'performerId', id)
  const timestamp = requireTimestampField(docSnap, 'timestamp', id)

  return {
    id,
    action,
    targetId,
    performerId,
    timestamp,
  }
}

function requireStringField(docSnap: DocumentData, field: string, auditLogId: string): string {
  const value = docSnap?.[field]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `Invalid or missing required audit log field "${field}" for audit log ${auditLogId}`
    )
  }

  return value
}

function requireTimestampField(docSnap: DocumentData, field: string, auditLogId: string): string {
  const value = docSnap?.[field]
  if (!(value instanceof Timestamp)) {
    throw new Error(
      `Invalid or missing required audit log field "${field}" for audit log ${auditLogId}`
    )
  }

  return value.toDate().toISOString()
}

function validateAuditLogId(id: unknown): string {
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
